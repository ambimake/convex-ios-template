/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import {
  type CurrentPlan,
  accessTier,
  badgeDecision,
  currentPlanFromEntitlement,
  evaluatePlanLimit,
  gateDecision,
  limitConfigFromEnv,
  meteredBannerVisibility,
  planLimitWindowStart,
} from "./lib/subscriptionPlan";

const modules = import.meta.glob("./**/*.ts");
const PRO = "com.example.app.pro.monthly";
const env = { SUBSCRIPTION_PRO_PRODUCT_ID: PRO };

const identityA = { issuer: "test", subject: "a", tokenIdentifier: "test|a" };
const identityB = { issuer: "test", subject: "b", tokenIdentifier: "test|b" };

describe("currentPlanFromEntitlement", () => {
  const now = 1_000_000;

  it("returns free for no entitlement", () => {
    expect(currentPlanFromEntitlement(null, now, env)).toMatchObject({ tier: "free", status: "free" });
  });

  it("returns verification_pending for pending status", () => {
    const plan = currentPlanFromEntitlement(
      { productId: PRO, status: "pending_verification" },
      now,
      env,
    );
    expect(plan).toMatchObject({ tier: "free", status: "verification_pending" });
  });

  it("returns active pro for a verified, unexpired entitlement", () => {
    const plan = currentPlanFromEntitlement(
      { productId: PRO, status: "verified_active", expiresAt: now + 1000 },
      now,
      env,
    );
    expect(plan).toMatchObject({ tier: "pro", status: "active", activeUntil: now + 1000 });
  });

  it("returns expired when the verified entitlement has lapsed", () => {
    const plan = currentPlanFromEntitlement(
      { productId: PRO, status: "verified_active", expiresAt: now - 1 },
      now,
      env,
    );
    expect(plan).toMatchObject({ tier: "free", status: "expired" });
  });

  it("returns revoked for a revoked entitlement", () => {
    const plan = currentPlanFromEntitlement({ productId: PRO, status: "revoked" }, now, env);
    expect(plan).toMatchObject({ tier: "free", status: "revoked" });
  });

  it("ignores an entitlement for a different product", () => {
    const plan = currentPlanFromEntitlement(
      { productId: "com.other.pro", status: "verified_active", expiresAt: now + 1000 },
      now,
      env,
    );
    expect(plan).toMatchObject({ tier: "free", status: "free" });
  });
});

describe("evaluatePlanLimit", () => {
  const config = limitConfigFromEnv({});

  it("allows usage under the limit", () => {
    expect(
      evaluatePlanLimit({ config, planTier: "free", limitName: "command_daily", used: 10 }),
    ).toEqual({ decision: "allowed" });
  });

  it("blocks usage at the limit", () => {
    expect(
      evaluatePlanLimit({ config, planTier: "free", limitName: "command_daily", used: 250 }),
    ).toEqual({ decision: "blocked", reasonCode: "daily_limit_reached" });
  });

  it("treats a negative limit as unlimited", () => {
    const unlimited = {
      free: { command_daily: -1, voice_transcription_seconds_daily: -1 },
      pro: { command_daily: -1, voice_transcription_seconds_daily: -1 },
    } as const;
    expect(
      evaluatePlanLimit({ config: unlimited, planTier: "free", limitName: "command_daily", used: 10_000 }),
    ).toEqual({ decision: "allowed" });
  });

  it("reads limits from env overrides", () => {
    const config = limitConfigFromEnv({ FREE_COMMAND_DAILY_LIMIT: "5" });
    expect(config.free.command_daily).toBe(5);
  });
});

describe("planLimitWindowStart", () => {
  it("returns UTC midnight for the day", () => {
    const noon = Date.UTC(2026, 0, 2, 12, 0, 0);
    expect(planLimitWindowStart(noon)).toBe(Date.UTC(2026, 0, 2, 0, 0, 0));
  });
});

describe("access-gating rule engine", () => {
  const proPlan: CurrentPlan = { tier: "pro", status: "active", displayName: "Pro" };
  const freePlan: CurrentPlan = { tier: "free", status: "free", displayName: "Free" };

  it("resolves the access tier from plan + metered allowance", () => {
    expect(accessTier({ plan: proPlan, meteredUsed: 0, meteredAllowance: 5 })).toBe("pro");
    expect(accessTier({ plan: freePlan, meteredUsed: 2, meteredAllowance: 5 })).toBe("metered");
    expect(accessTier({ plan: freePlan, meteredUsed: 5, meteredAllowance: 5 })).toBe("free");
    expect(accessTier({ plan: freePlan, meteredUsed: 0, meteredAllowance: 0 })).toBe("free");
  });

  it("gates premium features by tier", () => {
    expect(gateDecision("pro", true)).toBe("allow");
    expect(gateDecision("metered", true)).toBe("allow");
    expect(gateDecision("free", true)).toBe("show_paywall");
    expect(gateDecision("free", false)).toBe("allow"); // non-premium always allowed
  });

  it("chooses the badge by tier", () => {
    expect(badgeDecision("pro", true)).toBe("hidden");
    expect(badgeDecision("metered", true)).toBe("badge_with_control");
    expect(badgeDecision("free", true)).toBe("badge_only");
    expect(badgeDecision("free", false)).toBe("hidden");
  });

  it("shows the remaining-allowance banner only in the metered tier", () => {
    expect(meteredBannerVisibility("metered", 2, 5)).toEqual({ visible: true, remaining: 3, total: 5 });
    expect(meteredBannerVisibility("pro", 0, 5)).toEqual({ visible: false });
    expect(meteredBannerVisibility("free", 5, 5)).toEqual({ visible: false });
  });
});

describe("subscription entitlement mutations", () => {
  it("defaults to free before any entitlement", async () => {
    const t = convexTest(schema, modules).withIdentity(identityA);
    expect(await t.query(api.subscription.currentPlan, {})).toMatchObject({ tier: "free", status: "free" });
  });

  it("client evidence only produces verification_pending, never active", async () => {
    const t = convexTest(schema, modules).withIdentity(identityA);
    const result = await t.mutation(api.subscription.submitEntitlementEvidence, {
      productId: PRO,
      evidence: "receipt-jws-blob",
    });
    expect(result.status).toBe("pending_verification");
    expect(await t.query(api.subscription.currentPlan, {})).toMatchObject({
      tier: "free",
      status: "verification_pending",
    });
  });

  it("rejects empty or oversized evidence", async () => {
    const t = convexTest(schema, modules).withIdentity(identityA);
    await expect(
      t.mutation(api.subscription.submitEntitlementEvidence, { productId: PRO, evidence: "" }),
    ).rejects.toThrow(/EVIDENCE_INVALID/);
  });

  it("grants active pro after a trusted verification result", async () => {
    const t = convexTest(schema, modules);
    await t.withIdentity(identityA).mutation(api.subscription.submitEntitlementEvidence, {
      productId: PRO,
      evidence: "receipt",
    });
    await t.mutation(internal.subscription.applyVerifiedEntitlement, {
      ownerKey: "test|a",
      productId: PRO,
      status: "verified_active",
      expiresAt: Date.now() + 60_000,
    });
    expect(await t.withIdentity(identityA).query(api.subscription.currentPlan, {})).toMatchObject({
      tier: "pro",
      status: "active",
    });
  });

  it("keeps entitlements isolated per owner", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.subscription.applyVerifiedEntitlement, {
      ownerKey: "test|a",
      productId: PRO,
      status: "verified_active",
      expiresAt: Date.now() + 60_000,
    });
    expect(await t.withIdentity(identityB).query(api.subscription.currentPlan, {})).toMatchObject({
      tier: "free",
      status: "free",
    });
  });
});
