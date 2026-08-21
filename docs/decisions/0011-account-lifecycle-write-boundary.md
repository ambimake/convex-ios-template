# 0011 — Account lifecycle write boundary

Status: Accepted (template default)

## Context

Most user-data writes should flow through one public action and the validated
domain apply layer. But some account state is different — it isn't a domain
operation: account deletion (an App Store requirement) and account-level
entitlement facts.

## Decision

A narrow `convex/account.ts` module may perform owner-scoped writes
(`insert`/`patch`/`delete`) **only** for authenticated account lifecycle: cleanup
on deletion, Sign in with Apple revocation credentials, and actor-private
entitlement facts. It must:

- derive ownership from `requireOwnerKey(ctx)` and accept **no** client-supplied
  owner/user identifier;
- delete or update only rows for the current owner;
- expose account **deletion** as a narrow public action that revokes the stored
  Apple refresh token *before* calling the internal cleanup mutation — clients
  must not call the internal delete directly and bypass revocation.

This does not open a second assistant write path or a generic admin API.

## Consequences

- CI allows narrow account-state writes in `account.ts` alongside the domain
  write files; a boundary test enforces that nothing else writes there.
- Deletion removes all owner-scoped app data together (profile, domain rows,
  history, usage events, stored revocation credential) and emits no new usage
  event afterward.
- If account-wide deletion later exceeds transaction limits, shape a batched
  lifecycle process rather than silently shipping partial deletion.
