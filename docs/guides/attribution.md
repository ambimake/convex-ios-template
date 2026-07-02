# How this template does install attribution

Apple AdServices attribution via a backend token exchange, no IDFA. See
[ADR 0014](../decisions/0014-install-attribution-backend-token-exchange.md).

- **Device**: fetch the AdServices token (`AAAttribution.attributionToken()`)
  once, upload it to a backend endpoint with a stable anonymous join key (the
  analytics/install ID), app version/build, and bundle ID, under a shared-secret
  header. Retry with bounded backoff; dedupe locally so it's sent once.
- **Backend** (Convex HTTP action): validate + shared-secret auth, rate-limit
  per-client and per-user, atomically claim a pending record, exchange the token
  with Apple, and store campaign fields plus a SHA-256 hash of the token for
  dedup. **Never log the raw token.**
- **Join**: attribute downstream funnel events (onboarding → activation →
  purchase) by the anonymous ID, not IDFA. ATT is optional.

## Status in this template

This is the **decision + shape**, not shipped code. A complete reference
implementation exists in a source-app checkout: an iOS `AppleAdsAttributionReporter`
(fetch/upload/retry/dedup) plus a Convex HTTP action and core helpers
(validation, Apple exchange, hashing, rate limits). Porting it — with the schema
tables, HTTP route, and rate-limit config it needs — is a focused follow-up.
Campaign and localization strategy is product-specific and stays out of the
template.
