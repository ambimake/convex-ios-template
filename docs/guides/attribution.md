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

**Shipped (backend, tested):**

- `convex/lib/attributionCore.ts` — pure helpers (payload validation, Apple token
  exchange with injectable fetch/sleep, dedup hash), unit-tested.
- `convex/attribution.ts` — the HTTP action plus rate-limit and claim/upsert
  mutations; `convex/http.ts` mounts `POST /v1/apple-ads-attribution`.
- `convex/attribution.test.ts` — core, mutation, and end-to-end HTTP-action tests
  (offline, via `convex-test`).
- Schema tables `adAttributions` + `adAttributionRateLimits`.

**Shipped (iOS seam, follows the template convention — not compiled in CI here):**

- `ios/Core/TemplateAdAttributionReporter.swift` — fetches the AdServices token
  and uploads once per install with retry/dedup, and **no-ops until** the endpoint
  URL and shared secret are configured via build settings.

**Wiring:** set `APPLE_ADS_ATTRIBUTION_SHARED_SECRET` (and optionally
`APPLE_ADS_ATTRIBUTION_BUNDLE_ID`) as Convex deployment env vars; point the iOS
reporter at the deployment's `/v1/apple-ads-attribution` URL with the same
secret. Campaign and localization strategy is product-specific and stays out of
the template.
