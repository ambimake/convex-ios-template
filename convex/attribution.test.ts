/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import {
  buildAttributionResponse,
  exchangeAttributionToken,
  parseIncomingPayload,
} from "./lib/attributionCore";

const modules = import.meta.glob("./**/*.ts");

const validBody = {
  analyticsUserID: "anon-123",
  attributionToken: "token-abc",
  bundleID: "com.example.app",
  appVersion: "1.0.0",
  appBuild: "42",
};

describe("attributionCore.parseIncomingPayload", () => {
  it("accepts a well-formed payload", () => {
    const parsed = parseIncomingPayload(validBody);
    expect(parsed).toMatchObject({ analyticsUserID: "anon-123", bundleID: "com.example.app" });
  });

  it("rejects a payload missing a required field", () => {
    const { appBuild, ...rest } = validBody;
    expect(parseIncomingPayload(rest)).toBeNull();
  });

  it("rejects a bundle mismatch when a bundle is pinned", () => {
    expect(parseIncomingPayload(validBody, { expectedBundleID: "com.other.app" })).toBeNull();
    expect(parseIncomingPayload(validBody, { expectedBundleID: "com.example.app" })).not.toBeNull();
  });

  it("rejects a non-object body", () => {
    expect(parseIncomingPayload("nope")).toBeNull();
    expect(parseIncomingPayload(null)).toBeNull();
  });
});

describe("attributionCore.exchangeAttributionToken", () => {
  it("returns Apple's JSON on success", async () => {
    const fetcher = vi.fn(async () => ({
      status: 200,
      ok: true,
      json: async () => ({ attribution: true, campaignId: 7 }),
    }));
    const result = await exchangeAttributionToken("tok", { fetcher });
    expect(result).toMatchObject({ attribution: true, campaignId: 7 });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("retries on 404 then succeeds", async () => {
    const responses = [
      { status: 404, ok: false, json: async () => ({}) },
      { status: 200, ok: true, json: async () => ({ attribution: false }) },
    ];
    const fetcher = vi.fn(async () => responses.shift()!);
    const sleep = vi.fn(async () => {});
    const result = await exchangeAttributionToken("tok", { fetcher, sleep, maxAttempts: 3 });
    expect(result).toMatchObject({ attribution: false });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledOnce();
  });

  it("throws on a non-ok, non-404 response", async () => {
    const fetcher = vi.fn(async () => ({ status: 500, ok: false, json: async () => ({}) }));
    await expect(exchangeAttributionToken("tok", { fetcher })).rejects.toThrow(/500/);
  });
});

describe("attributionCore.buildAttributionResponse", () => {
  it("reports attribution and duplicate flags", () => {
    expect(buildAttributionResponse({ attribution: true }, false)).toEqual({
      ok: true,
      attribution: true,
      duplicate: false,
    });
    expect(buildAttributionResponse({}, true)).toEqual({
      ok: true,
      attribution: false,
      duplicate: true,
    });
  });
});

describe("attribution rate limiting", () => {
  it("allows under the limit and blocks at the limit within a window", async () => {
    const t = convexTest(schema, modules);
    const args = { key: "k", limit: 2, windowMs: 1000, now: 1000 };
    expect(await t.mutation(internal.attribution.checkRateLimit, args)).toMatchObject({ allowed: true });
    expect(await t.mutation(internal.attribution.checkRateLimit, { ...args, now: 1100 })).toMatchObject({ allowed: true });
    const blocked = await t.mutation(internal.attribution.checkRateLimit, { ...args, now: 1200 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", async () => {
    const t = convexTest(schema, modules);
    const args = { key: "k2", limit: 1, windowMs: 1000, now: 1000 };
    await t.mutation(internal.attribution.checkRateLimit, args);
    expect(await t.mutation(internal.attribution.checkRateLimit, { ...args, now: 999 + 1000 + 1 })).toMatchObject({ allowed: true });
  });
});

describe("attribution claim dedup", () => {
  const payload = {
    analyticsUserID: "anon-9",
    bundleID: "com.example.app",
    appVersion: "1.0.0",
    appBuild: "1",
  };

  it("claims a fresh request then treats a repeat as in-flight", async () => {
    const t = convexTest(schema, modules);
    const first = await t.mutation(internal.attribution.claimAttributionRequest, {
      payload,
      attributionTokenHash: "hash-1",
    });
    expect(first.status).toBe("claimed");
    const second = await t.mutation(internal.attribution.claimAttributionRequest, {
      payload,
      attributionTokenHash: "hash-1",
    });
    expect(second.status).toBe("inFlight");
  });

  it("stores the campaign result on upsert", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.attribution.claimAttributionRequest, {
      payload,
      attributionTokenHash: "hash-2",
    });
    await t.mutation(internal.attribution.upsert, {
      payload,
      attributionTokenHash: "hash-2",
      appleAttribution: { attribution: true, campaignId: 12 },
    });
    const rows = await t.run(async (ctx) =>
      ctx.db
        .query("adAttributions")
        .withIndex("by_analyticsUserID", (q) => q.eq("analyticsUserID", "anon-9"))
        .collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: "completed", attribution: true, campaignId: 12 });
  });
});

describe("submitAttribution HTTP action", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubEnvAndFetch(appleJson: Record<string, unknown>) {
    vi.stubGlobal("process", {
      env: { APPLE_ADS_ATTRIBUTION_SHARED_SECRET: "secret" },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 200,
        ok: true,
        json: async () => appleJson,
      })),
    );
  }

  it("rejects an unauthorized request", async () => {
    const t = convexTest(schema, modules);
    vi.stubGlobal("process", { env: { APPLE_ADS_ATTRIBUTION_SHARED_SECRET: "secret" } });
    const res = await t.fetch("/v1/apple-ads-attribution", {
      method: "POST",
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(401);
  });

  it("exchanges and stores on a fresh authorized request", async () => {
    const t = convexTest(schema, modules);
    stubEnvAndFetch({ attribution: true, campaignId: 5 });
    const res = await t.fetch("/v1/apple-ads-attribution", {
      method: "POST",
      headers: { "x-apple-ads-attribution-secret": "secret", "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, attribution: true, duplicate: false });
  });

  it("returns a duplicate response on a repeat request", async () => {
    const t = convexTest(schema, modules);
    stubEnvAndFetch({ attribution: true });
    const init = {
      method: "POST",
      headers: { "x-apple-ads-attribution-secret": "secret", "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    };
    await t.fetch("/v1/apple-ads-attribution", init);
    const res = await t.fetch("/v1/apple-ads-attribution", init);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ duplicate: true });
  });
});
