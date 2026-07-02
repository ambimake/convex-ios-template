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

## Which backend? Server-authoritative (this template) vs. client-only

Two source-app approaches informed this:

- **Server-authoritative** (this template's choice): the Convex backend owns
  entitlement, verification, and limits. The client can't spoof access, state
  syncs across devices, and the server can gate provider-cost features. Best for
  a Convex app — it's what we shipped.
- **Client-only** (StoreKit + Keychain/UserDefaults, no backend): simpler and
  offline-friendly, but the client is the authority (spoofable), no cross-device
  sync, no server-side cost gating. Fine for a purely local app; not our default.

## Access-gating rule engine + paywall

A clean, reusable pattern (a pure, stateless rule engine — state lives in the
plan; rules live in pure functions):

- **Backend (tested):** `accessTier`, `gateDecision`, `badgeDecision`,
  `meteredBannerVisibility` in `convex/lib/subscriptionPlan.ts`. `metered` is an
  optional free-tier allowance (N free premium uses before the paywall);
  `maxMeteredUses = 0` gives a plain pro/free hard gate.
- **iOS (seam):** `ios/Core/TemplateAccessPolicy.swift` mirrors that logic as pure
  Swift, and `ios/Features/Paywall/TemplatePaywallView.swift` is a **neutral
  paywall scaffold to restyle** — the look and feel is the clone's to own; the
  gating decisions come from the backend-owned entitlement.

The **metered free-tier** (a "3 of 5 free uses left" banner, then the paywall) is
a nice UX shape layered on top of the hard gate; drive the metered counter from
server-side usage so it can't be reset by reinstalling.
