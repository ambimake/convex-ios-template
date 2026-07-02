# How this template does payments

Direct StoreKit 2 with backend-owned entitlement authority. See
[ADR 0013](../decisions/0013-apple-subscription-entitlements.md).

- **No third-party paywall/entitlement SDK.** iOS owns purchase, restore, and
  `AppStore.sync()`; the backend owns entitlement state and fair-use limits.
- **Entitlement is server-authoritative.** Derived from Apple transaction proof,
  stored as bounded evidence (never raw JWS). Unverified client proof cannot grant
  verified entitlement. Entitlement writes are `actor_private` under the account
  lifecycle boundary ([0011](../decisions/0011-account-lifecycle-write-boundary.md)).
- **Simple tiers.** Account-level `free`/`pro`, not a feature-by-feature graph.
  Per-tier limits are small, explicit, and env-configurable.
- **Two shipping shapes** to choose from:
  - *Hard-gated launch* — only an active (or verification-pending) entitlement
    admits the main experience; free/expired stay at the paywall.
  - *Metered free tier* — a client-side counter (Keychain-persisted so it
    survives reinstall) gates a capped free allowance, then the paywall.

## Status in this template

**Shipped (backend, tested):** the entitlement authority.

- `convex/lib/subscriptionPlan.ts` — pure tier/status/limit resolution
  (`currentPlanFromEntitlement`, `evaluatePlanLimit`, env-configurable limits).
- `convex/subscription.ts` — `currentPlan` (auth-derived) query;
  `submitEntitlementEvidence` (the client can only produce
  `pending_verification` — never grant itself access); `applyVerifiedEntitlement`
  (internal, called by the trusted verification step).
- `subscriptions` table; `convex/subscription.test.ts` (pure + mutation/query,
  including cross-owner isolation and the client-can't-self-grant invariant).

**Clone seams (iOS / vendor):**

- The **StoreKit 2 purchase/restore UI** and paywall are app-specific — build
  them in the iOS client and call `submitEntitlementEvidence` with the receipt.
- The **Apple App Store Server API verification** step is where you verify the
  receipt server-side and then call `applyVerifiedEntitlement`. This is
  deliberately a seam: it needs your App Store Connect keys and the exact
  verification policy, which don't belong hardcoded in a template.

**Wiring:** set `SUBSCRIPTION_PRO_PRODUCT_ID` (and optional per-tier limit env
vars) as Convex deployment env vars. Gate features with `evaluatePlanLimit`
against the owner's plan from `currentPlan`.
