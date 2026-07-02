# 0013 — Direct Apple subscription entitlements

Status: Accepted (template default; adopt when the app monetizes)

## Context

A paid iOS app needs a purchase flow and an authority for "is this account
entitled?". The choice is between a third-party paywall/entitlement SDK and
direct StoreKit with backend-owned entitlement.

## Decision

- Use **StoreKit 2 directly** — no third-party paywall/entitlement vendor.
- **iOS owns** purchase, restore, and `AppStore.sync()`.
- **The backend owns entitlement state** and fair-use limits. Entitlement is
  derived from Apple transaction proof and stored as **bounded account evidence**
  (never raw JWS payloads). Unverified client proof cannot grant verified
  entitlement.
- Model tiers as simple **account-level tiers** (e.g. `free` / `pro`), not a
  feature-by-feature access graph. Keep per-tier limits small, explicit, and
  configurable (env-driven), not hardcoded.
- Entitlement writes are an approved narrow case of the account lifecycle write
  boundary ([0011](0011-account-lifecycle-write-boundary.md)) — `actor_private`,
  not a second assistant write path.

## Consequences

- No vendor lock-in; the backend is the single source of truth for entitlement,
  so gating decisions (provider-cost limits, gated launch) are server-authoritative.
- A hard-gated launch (only an active or verification-pending entitlement admits
  the main experience) is one option layered on top; a metered free tier with a
  client-side counter (Keychain-persisted so it survives reinstall) is another.
- See [docs/guides/payments.md](../guides/payments.md). Reference implementations
  exist in the source-app checkouts; the iOS StoreKit code is a follow-up port.
