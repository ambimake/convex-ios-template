# 0014 — Install attribution via backend token exchange

Status: Accepted (template default; adopt when running paid acquisition)

## Context

Attributing installs to ad campaigns without IDFA, while staying privacy-safe
and abuse-resistant. Apple's AdServices provides an on-device attribution token
that must be exchanged with Apple's API for campaign data.

## Decision

- The **device** fetches the AdServices attribution token
  (`AAAttribution.attributionToken()`) once and uploads it to a backend endpoint
  with a stable anonymous join key (an analytics/install ID), app version/build,
  and bundle ID — under a shared-secret auth header.
- The **backend** (a Convex HTTP action) validates the payload, rate-limits
  (per-client and per-user), **atomically claims** a pending attribution record,
  then exchanges the token with Apple and stores the campaign fields (org,
  campaign, ad group, keyword, ad, creative-set) plus a **SHA-256 hash of the
  token** for deduplication.
- Join attribution to product analytics via the **anonymous ID**, not IDFA; ATT
  is optional. **Never log the raw token**; retry with backoff (bounded attempts)
  on failure.

## Consequences

- Campaign attribution works without IDFA and without a third-party attribution
  SDK; the backend owns the Apple token exchange and dedup.
- Downstream funnel joins (onboarding → activation → purchase) key on the
  anonymous ID. Campaign/localization strategy is product-specific and lives
  outside the template.
- Implemented in this template: `convex/attribution.ts` (HTTP action + rate-limit
  and claim mutations), `convex/lib/attributionCore.ts` (pure helpers, unit-tested
  in `convex/attribution.test.ts`), the `/v1/apple-ads-attribution` route in
  `convex/http.ts`, and the `ios/Core/TemplateAdAttributionReporter.swift` seam
  (no-ops until the endpoint + shared secret are configured). See
  [docs/guides/attribution.md](../guides/attribution.md).
