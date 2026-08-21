# 0006 — Observability split

Status: Accepted (template default)

## Context

Different signals want different homes. Mixing crash diagnostics, product
analytics, and operational/audit records into one sink makes each harder to
query and blurs the privacy boundary.

## Decision

Split observability by signal type across three homes:

1. **Errors / crashes / exception diagnostics → Sentry.** Best-effort, fails
   open when the env var is absent. Never claims user-visible success it didn't
   verify (e.g. records an account-cleanup report rather than asserting deletion).
2. **Product analytics → PostHog.** A deliberate event taxonomy describing
   user-facing behavior, with privacy-bounded, categorical properties — never
   raw user content or free-form identifiers.
3. **Operational / usage records → Convex tables** (e.g. `usageEvents`).
   Owner-scoped, idempotent where it matters, for rate limits, audit, and
   support diagnostics that must be transactional with the write that caused them.

Analytics event names and their properties live in one place so the taxonomy is
reviewable; operational events are separate from the analytics taxonomy.

## Consequences

- Each signal is queried where it belongs; the privacy boundary is explicit.
- Vendor hooks (Sentry, PostHog) are fetch-based and skip safely when
  unconfigured, so the app runs without keys in dev/CI.
- New user-facing behavior adds an analytics event to the taxonomy; new
  transactional facts add an operational record — they are not the same thing.

Swap: replace Sentry/PostHog with any error and analytics vendors by keeping the
same three-way split and the fetch-based, fail-open hook shape.
