// Pure, provider-agnostic subscription plan logic: tiers, statuses, per-tier
// limits, and how a stored entitlement resolves to the current plan. No Convex
// or network state here, so it unit-tests in isolation. See docs/decisions/0013
// and docs/guides/payments.md.

export const PRO_DISPLAY_NAME = "Pro";
export const FREE_DISPLAY_NAME = "Free";
export const MAX_ENTITLEMENT_EVIDENCE_CHARS = 16_000;

export type PlanTier = "free" | "pro";

// User-facing plan status. `verification_pending` grants no paid access but is
// distinct from `free` so a gated launch can admit "we're checking your receipt".
export type CurrentPlanStatus =
  | "free"
  | "verification_pending"
  | "active"
  | "expired"
  | "revoked";

// Backend-owned entitlement status. The client can only ever produce
// `pending_verification`; the verified states come from a trusted verification
// step (Apple App Store Server API), never from client claims.
export type EntitlementStatus =
  | "pending_verification"
  | "verified_active"
  | "verified_expired"
  | "revoked"
  | "verification_failed";

export type StoredEntitlement = {
  productId: string;
  status: EntitlementStatus;
  expiresAt?: number;
  revokedAt?: number;
};

export type CurrentPlan = {
  tier: PlanTier;
  status: CurrentPlanStatus;
  displayName: string;
  productId?: string;
  activeUntil?: number;
};

// Generic per-tier daily limits. Extend PlanLimitName for your app's metered
// operations; values are env-overridable so a clone tunes them without a deploy.
export type PlanLimitName = "command_daily" | "voice_transcription_seconds_daily";

export type LimitConfig = Record<PlanTier, Record<PlanLimitName, number>>;

const DEFAULT_FREE_LIMITS: Record<PlanLimitName, number> = {
  command_daily: 250,
  voice_transcription_seconds_daily: 18_000,
};

const DEFAULT_PRO_LIMITS: Record<PlanLimitName, number> = {
  command_daily: 2_500,
  voice_transcription_seconds_daily: 180_000,
};

const ENV_LIMIT_KEYS: Record<PlanTier, Record<PlanLimitName, string>> = {
  free: {
    command_daily: "FREE_COMMAND_DAILY_LIMIT",
    voice_transcription_seconds_daily: "FREE_VOICE_TRANSCRIPTION_SECONDS_DAILY_LIMIT",
  },
  pro: {
    command_daily: "PRO_COMMAND_DAILY_LIMIT",
    voice_transcription_seconds_daily: "PRO_VOICE_TRANSCRIPTION_SECONDS_DAILY_LIMIT",
  },
};

// Safe env accessor: some runtimes (edge test env) don't define `process`.
function safeEnv(): Record<string, string | undefined> {
  const proc = (globalThis as unknown as {
    process?: { env?: Record<string, string | undefined> };
  }).process;
  return proc?.env ?? {};
}

export function proProductId(env: Record<string, string | undefined> = safeEnv()): string {
  return env.SUBSCRIPTION_PRO_PRODUCT_ID?.trim() || "com.example.app.pro.monthly";
}

export function limitConfigFromEnv(
  env: Record<string, string | undefined> = safeEnv(),
): LimitConfig {
  return {
    free: limitConfigForTier("free", DEFAULT_FREE_LIMITS, env),
    pro: limitConfigForTier("pro", DEFAULT_PRO_LIMITS, env),
  };
}

export function currentPlanFromEntitlement(
  entitlement: StoredEntitlement | null,
  now: number,
  env: Record<string, string | undefined> = safeEnv(),
): CurrentPlan {
  if (!entitlement || entitlement.productId !== proProductId(env)) return freePlan("free");
  switch (entitlement.status) {
    case "pending_verification":
    case "verification_failed":
      return freePlan("verification_pending", entitlement.productId);
    case "revoked":
      return freePlan("revoked", entitlement.productId);
    case "verified_expired":
      return freePlan("expired", entitlement.productId);
    case "verified_active":
      if (entitlement.expiresAt === undefined) {
        return freePlan("verification_pending", entitlement.productId);
      }
      if (entitlement.expiresAt <= now) return freePlan("expired", entitlement.productId);
      return {
        tier: "pro",
        status: "active",
        displayName: PRO_DISPLAY_NAME,
        productId: entitlement.productId,
        activeUntil: entitlement.expiresAt,
      };
  }
}

export function evaluatePlanLimit(args: {
  config: LimitConfig;
  planTier: PlanTier;
  limitName: PlanLimitName;
  used: number;
  requested?: number;
}): { decision: "allowed" } | { decision: "blocked"; reasonCode: "daily_limit_reached" } {
  const limit = args.config[args.planTier][args.limitName];
  if (limit < 0) return { decision: "allowed" }; // negative = unlimited
  const requested = args.requested ?? 1;
  return args.used + requested > limit
    ? { decision: "blocked", reasonCode: "daily_limit_reached" }
    : { decision: "allowed" };
}

export function planLimitWindowStart(now: number): number {
  const date = new Date(now);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// --- Access-gating rule engine (pure) ---------------------------------------
// A generic version of a stateless paywall rule engine: the plan owns state,
// these functions own every gating rule. `metered` is an optional free-tier
// allowance (N free premium uses before the paywall); pass meteredAllowance = 0
// to disable it and get a plain pro/free hard gate.

// pro = entitled; metered = not entitled but has free allowance remaining;
// free = not entitled and allowance exhausted.
export type AccessTier = "pro" | "metered" | "free";
export type FeatureGate = "allow" | "show_paywall";
// badge_only: badge replaces the control (free); badge_with_control: badge shown
// alongside a usable control (metered).
export type BadgeState = "hidden" | "badge_only" | "badge_with_control";
export type BannerState =
  | { visible: true; remaining: number; total: number }
  | { visible: false };

export function accessTier(args: {
  plan: CurrentPlan;
  meteredUsed: number;
  meteredAllowance: number;
}): AccessTier {
  if (args.plan.tier === "pro") return "pro";
  if (args.meteredAllowance > 0 && args.meteredUsed < args.meteredAllowance) return "metered";
  return "free";
}

export function gateDecision(tier: AccessTier, isFeaturePremium: boolean): FeatureGate {
  if (!isFeaturePremium) return "allow";
  return tier === "free" ? "show_paywall" : "allow";
}

export function badgeDecision(tier: AccessTier, isFeaturePremium: boolean): BadgeState {
  if (!isFeaturePremium) return "hidden";
  switch (tier) {
    case "pro":
      return "hidden";
    case "metered":
      return "badge_with_control";
    case "free":
      return "badge_only";
  }
}

export function meteredBannerVisibility(
  tier: AccessTier,
  meteredUsed: number,
  meteredAllowance: number,
): BannerState {
  if (tier !== "metered") return { visible: false };
  return { visible: true, remaining: meteredAllowance - meteredUsed, total: meteredAllowance };
}

function limitConfigForTier(
  tier: PlanTier,
  defaults: Record<PlanLimitName, number>,
  env: Record<string, string | undefined>,
): Record<PlanLimitName, number> {
  return Object.fromEntries(
    (Object.keys(defaults) as PlanLimitName[]).map((limitName) => [
      limitName,
      parseNonNegativeInteger(env[ENV_LIMIT_KEYS[tier][limitName]], defaults[limitName]),
    ]),
  ) as Record<PlanLimitName, number>;
}

function parseNonNegativeInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim().length === 0) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

function freePlan(status: CurrentPlanStatus, productId?: string): CurrentPlan {
  return {
    tier: "free",
    status,
    displayName: FREE_DISPLAY_NAME,
    ...(productId ? { productId } : {}),
  };
}
