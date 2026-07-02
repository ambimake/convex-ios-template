# How this template does auth

Sign in with Apple + Convex, with ownership derived from backend auth identity.
See [ADR 0010](../decisions/0010-ios-convex-client-auth.md),
[0011](../decisions/0011-account-lifecycle-write-boundary.md), and
[0012](../decisions/0012-user-data-security-and-diagnostics-boundary.md).

- **Identity**: Sign in with Apple via direct Apple ID tokens; the `ConvexMobile`
  Swift client carries auth. Ownership always derives from Convex auth identity —
  never from client-supplied user IDs.
- **Display vs. ownership**: name/email are display-only fields on the profile;
  internal owner keys are never user-facing.
- **Ownership on every write**: backend functions call `requireOwnerKey(ctx)` and
  query through owner-qualified indexes. Never accept an owner as an argument.
  See [convex-auth-ownership](../learnings/convex-auth-ownership.md).
- **Account lifecycle**: a narrow `account.ts` handles deletion and entitlement
  facts; deletion is a public action that revokes the Apple refresh token before
  internal cleanup.
- **Reads**: `ConvexClientWithAuth` has no one-shot query helper — use
  subscribe-and-take-first. See
  [swift-convex-auth-query-reads](../learnings/swift-convex-auth-query-reads.md).
- **Permissions**: model the cross-product of permission states, not just
  all-allowed/all-denied. See
  [ios-permission-state-mapping](../learnings/ios-permission-state-mapping.md).

Setup gotchas (entitlements, first-authorization claims, device deployment URL)
are in ADR 0010's implementation notes.
