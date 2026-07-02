# 0012 — User-data security & diagnostics boundary

Status: Accepted (template default)

## Context

User-data surfaces and production diagnostics both need explicit, testable
boundaries. Ad hoc "emit what's convenient" telemetry and unclassified mutation
surfaces are how privacy leaks and cross-owner bugs ship.

## Decision — executable security-boundary policy

Classify every user-data surface with an executable policy (e.g.
`convex/lib/securityBoundaryPolicy.ts`) rather than prose alone. Policy classes:

- `owner_admin` — database-owner-only surfaces.
- `editor_allowed` — owner plus authorized collaborators.
- `actor_private` — the authenticated actor's own profile, account lifecycle,
  credentials.
- `read_only` — reads without mutation, access/token constrained.
- `backend_only` — trusted backend code; no second user-data write path.
- `diagnostics_only` — operator evidence through allowlists, no private content.
- `future_surface` — documented future entry points default to no exposure.

Adding a surface means: classify it, update the policy module, add direct tests
by class (not one example), and gate cross-owner access with a boundary test.

## Decision — allowlist-only diagnostics

A field is emitted **only** when a decision, executable formatter, or plan names
it diagnostic-safe for that destination — never because it's locally convenient.

- **Forbidden automatically:** user-authored text, transcripts, raw errors, raw
  IDs, operation envelopes, existence/membership facts, screenshots, replay.
- **Allowed shape:** signal home, subsystem, typed failure kind, user-impact,
  app version, coarse counts, sanitized codes, timestamp, correlation handles.
- **Identity per destination:** pseudonymize at the vendor boundary (e.g. a
  versioned destination-scoped SHA-256 of the owner key); keep the raw owner key
  only for approved backend-owned behavior.
- Diagnostic data follows the account-deletion posture.

## Consequences

Security and privacy boundaries are code and tests, not intentions. New surfaces
and new telemetry fields are deliberate, reviewable additions. See
[diagnostics-identity-fixtures](../learnings/diagnostics-identity-fixtures.md)
for the cross-runtime identity contract.
