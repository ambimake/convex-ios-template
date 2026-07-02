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

This is the **decision + shape**, not shipped code — the template's example app
isn't monetized. Reference implementations live in the source-app checkouts
(direct StoreKit store + Convex entitlement, and a client-side metered manager).
Porting the iOS StoreKit code and the Convex entitlement module is a focused
follow-up project, gated on the app actually monetizing.
