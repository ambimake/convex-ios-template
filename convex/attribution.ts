// Install-attribution backend: an HTTP endpoint that accepts an Apple AdServices
// token from the app, exchanges it with Apple, and stores the campaign result,
// with per-client and per-user rate limiting and token dedup. Provider-agnostic
// join key (analyticsUserID). See docs/decisions/0014 + docs/guides/attribution.md.
import { v } from "convex/values";

import {
  type AppleAttributionRecord,
  buildAttributionDocument,
  buildAttributionResponse,
  exchangeAttributionToken,
  parseIncomingPayload,
  sha256Hex,
} from "./lib/attributionCore";
import { internal } from "./_generated/api";
import { httpAction, internalMutation } from "./_generated/server";

const CLIENT_RATE_LIMIT_MAX_REQUESTS = 120;
const CLIENT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const USER_RATE_LIMIT_MAX_REQUESTS = 5;
const USER_RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const PENDING_CLAIM_TIMEOUT_MS = 10 * 60 * 1000;
const AUTHORIZATION_HEADER = "x-apple-ads-attribution-secret";
const AUTHORIZATION_SECRET_ENV_VAR = "APPLE_ADS_ATTRIBUTION_SHARED_SECRET";
const EXPECTED_BUNDLE_ID_ENV_VAR = "APPLE_ADS_ATTRIBUTION_BUNDLE_ID";

const attributionPayloadValidator = v.object({
  analyticsUserID: v.string(),
  bundleID: v.string(),
  appVersion: v.string(),
  appBuild: v.string(),
});

export const checkRateLimit = internalMutation({
  args: { key: v.string(), limit: v.number(), windowMs: v.number(), now: v.number() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adAttributionRateLimits")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing === null) {
      await ctx.db.insert("adAttributionRateLimits", {
        key: args.key,
        windowStartedAt: args.now,
        requestCount: 1,
        updatedAt: args.now,
      });
      return { allowed: true, retryAfterMs: 0 };
    }

    const windowExpiresAt = existing.windowStartedAt + args.windowMs;
    if (args.now >= windowExpiresAt) {
      await ctx.db.patch(existing._id, {
        windowStartedAt: args.now,
        requestCount: 1,
        updatedAt: args.now,
      });
      return { allowed: true, retryAfterMs: 0 };
    }

    if (existing.requestCount >= args.limit) {
      await ctx.db.patch(existing._id, { updatedAt: args.now });
      return { allowed: false, retryAfterMs: windowExpiresAt - args.now };
    }

    await ctx.db.patch(existing._id, {
      requestCount: existing.requestCount + 1,
      updatedAt: args.now,
    });
    return { allowed: true, retryAfterMs: 0 };
  },
});

export const claimAttributionRequest = internalMutation({
  args: { payload: attributionPayloadValidator, attributionTokenHash: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existingByUser = await ctx.db
      .query("adAttributions")
      .withIndex("by_analyticsUserID", (q) =>
        q.eq("analyticsUserID", args.payload.analyticsUserID),
      )
      .first();

    if (existingByUser !== null) {
      const canReclaim =
        existingByUser.status === "failed" ||
        (existingByUser.status === "pending" && !pendingClaimIsFresh(existingByUser, now));

      if (canReclaim) {
        const existingByToken = await ctx.db
          .query("adAttributions")
          .withIndex("by_attributionTokenHash", (q) =>
            q.eq("attributionTokenHash", args.attributionTokenHash),
          )
          .first();

        if (existingByToken !== null && existingByToken._id !== existingByUser._id) {
          return {
            status: duplicateClaimStatus(existingByToken, now),
            attribution: existingByToken.attribution === true,
          };
        }

        await ctx.db.patch(existingByUser._id, {
          ...args.payload,
          attributionTokenHash: args.attributionTokenHash,
          status: "pending",
          rawAttribution: {},
          updatedAt: now,
        });
        return { status: "claimed" as const, attribution: false };
      }
      return {
        status: duplicateClaimStatus(existingByUser, now),
        attribution: existingByUser.attribution === true,
      };
    }

    const existingByToken = await ctx.db
      .query("adAttributions")
      .withIndex("by_attributionTokenHash", (q) =>
        q.eq("attributionTokenHash", args.attributionTokenHash),
      )
      .first();

    if (existingByToken !== null) {
      return {
        status: duplicateClaimStatus(existingByToken, now),
        attribution: existingByToken.attribution === true,
      };
    }

    await ctx.db.insert("adAttributions", {
      ...args.payload,
      attributionTokenHash: args.attributionTokenHash,
      status: "pending",
      rawAttribution: {},
      createdAt: now,
      updatedAt: now,
    });
    return { status: "claimed" as const, attribution: false };
  },
});

export const upsert = internalMutation({
  args: {
    payload: attributionPayloadValidator,
    attributionTokenHash: v.string(),
    appleAttribution: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("adAttributions")
      .withIndex("by_analyticsUserID", (q) =>
        q.eq("analyticsUserID", args.payload.analyticsUserID),
      )
      .first();

    const document = buildAttributionDocument(args.payload, args.appleAttribution, now);

    if (existing === null) {
      await ctx.db.insert("adAttributions", {
        ...document,
        attributionTokenHash: args.attributionTokenHash,
        createdAt: now,
      });
    } else {
      await ctx.db.patch(existing._id, {
        ...document,
        attributionTokenHash: args.attributionTokenHash,
      });
    }
  },
});

export const markAttributionRequestFailed = internalMutation({
  args: { analyticsUserID: v.string(), attributionTokenHash: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adAttributions")
      .withIndex("by_analyticsUserID", (q) => q.eq("analyticsUserID", args.analyticsUserID))
      .first();

    if (
      existing !== null &&
      existing.status === "pending" &&
      existing.attributionTokenHash === args.attributionTokenHash
    ) {
      await ctx.db.patch(existing._id, { status: "failed", updatedAt: Date.now() });
    }
  },
});

export const submitAttribution = httpAction(async (ctx, request) => {
  const now = Date.now();
  if (!isAuthorized(request)) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  const clientRateLimitKey = await sha256Hex(`client:${clientIdentifierFrom(request)}`);
  const clientRateLimit = await ctx.runMutation(internal.attribution.checkRateLimit, {
    key: clientRateLimitKey,
    limit: CLIENT_RATE_LIMIT_MAX_REQUESTS,
    windowMs: CLIENT_RATE_LIMIT_WINDOW_MS,
    now,
  });
  if (!clientRateLimit.allowed) {
    return jsonResponse({ error: "rate_limited", retryAfterMs: clientRateLimit.retryAfterMs }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const payload = parseIncomingPayload(body, { expectedBundleID: expectedBundleId() });
  if (payload === null) {
    return jsonResponse({ error: "invalid_payload" }, 400);
  }

  const userRateLimitKey = await sha256Hex(`user:${payload.analyticsUserID}`);
  const userRateLimit = await ctx.runMutation(internal.attribution.checkRateLimit, {
    key: userRateLimitKey,
    limit: USER_RATE_LIMIT_MAX_REQUESTS,
    windowMs: USER_RATE_LIMIT_WINDOW_MS,
    now,
  });
  if (!userRateLimit.allowed) {
    return jsonResponse({ error: "rate_limited", retryAfterMs: userRateLimit.retryAfterMs }, 429);
  }

  const attributionTokenHash = await sha256Hex(payload.attributionToken);
  const { attributionToken, ...storedPayload } = payload;
  const claim = await ctx.runMutation(internal.attribution.claimAttributionRequest, {
    payload: storedPayload,
    attributionTokenHash,
  });

  if (claim.status !== "claimed") {
    return jsonResponse(
      buildAttributionResponse({ attribution: claim.attribution }, true),
      200,
    );
  }

  let appleAttribution: AppleAttributionRecord;
  try {
    appleAttribution = await exchangeAttributionToken(attributionToken);
  } catch {
    await ctx.runMutation(internal.attribution.markAttributionRequestFailed, {
      analyticsUserID: payload.analyticsUserID,
      attributionTokenHash,
    });
    return jsonResponse({ error: "apple_attribution_unavailable" }, 502);
  }

  try {
    await ctx.runMutation(internal.attribution.upsert, {
      payload: storedPayload,
      attributionTokenHash,
      appleAttribution,
    });
  } catch {
    return jsonResponse({ error: "attribution_storage_failed" }, 500);
  }

  return jsonResponse(buildAttributionResponse(appleAttribution, false), 200);
});

function isAuthorized(request: Request): boolean {
  const secret = configuredEnv(AUTHORIZATION_SECRET_ENV_VAR);
  return secret !== null && request.headers.get(AUTHORIZATION_HEADER) === secret;
}

function expectedBundleId(): string | undefined {
  return configuredEnv(EXPECTED_BUNDLE_ID_ENV_VAR) ?? undefined;
}

function configuredEnv(name: string): string | null {
  const env = (globalThis as unknown as {
    process?: { env?: Record<string, string | undefined> };
  }).process?.env;
  const value = env?.[name]?.trim();
  return value && !value.includes("$(") ? value : null;
}

function clientIdentifierFrom(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    "unknown-client"
  );
}

function duplicateClaimStatus(
  existing: { status: "pending" | "completed" | "failed"; updatedAt: number },
  now: number,
): "inFlight" | "duplicate" {
  return existing.status === "pending" && pendingClaimIsFresh(existing, now)
    ? "inFlight"
    : "duplicate";
}

function pendingClaimIsFresh(
  existing: { status: "pending" | "completed" | "failed"; updatedAt: number },
  now: number,
): boolean {
  return existing.status === "pending" && now - existing.updatedAt < PENDING_CLAIM_TIMEOUT_MS;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
