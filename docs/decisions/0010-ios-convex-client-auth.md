# 0010 — iOS Convex client auth (Sign in with Apple)

Status: Accepted (template default)

## Context

The iOS client must boot from authenticated backend data and share the same
ownership boundary as server-side writes, without a separate auth vendor.

## Decision

- Use **Sign in with Apple** with **direct Apple ID tokens** for Convex auth
  (provider domain `https://appleid.apple.com`); re-sign-in is acceptable when no
  valid token is cached.
- Use the official `ConvexMobile` Swift client (`get-convex/convex-swift`).
- **Ownership derives from Convex auth identity**, never from client-supplied
  user identifiers. The client subscribes to owner-scoped data without trusting
  any client-provided owner key.
- Persist a **display identity** (name/email from Apple claims) on the profile
  separately from internal owner keys/token identifiers. Owner keys are never
  user-facing; missing claims degrade to generic signed-in copy, never to keys.

## Implementation notes (reusable gotchas)

- The app target needs `CODE_SIGN_ENTITLEMENTS` set and the App ID must have the
  Sign in with Apple capability, or interactive sign-in fails with
  `AKAuthenticationError -7026` / `ASAuthorizationError 1000` — check target
  membership and signed entitlements before suspecting the backend.
- Apple may send `.fullName`/`.email` only on first authorization; an existing
  account may need to revoke the app in Apple ID settings to resend them.
- Cached-launch auth reinstalls via `ConvexClientWithAuth.loginFromCache()`
  while the token is present, unexpired, and accepted.
- On a physical device the client URL must be the reachable cloud deployment;
  loopback resolves to the phone, not the Mac.

## Consequences

The client reads owner-scoped data without trusting client identifiers; Settings
shows a signed-in account without exposing owner keys. Swap Apple auth for
another provider by keeping "ownership derives from backend auth identity."
