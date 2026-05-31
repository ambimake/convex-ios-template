---
name: convex-voice-agent
description: Use before changing the Convex backend for auth-owned commands, voice transcription, action payloads, Sentry/PostHog reporting, or account deletion cleanup.
---

# Convex Voice Agent

Read:

1. `AGENTS.md`
2. `docs/architecture.md`
3. `.agents/learnings/convex-action-payload-limits.md`
4. `.agents/learnings/convex-action-vendor-reporting.md`
5. `.agents/learnings/deployment-secrets.md`

## Boundaries

- `convex/commands.ts` is the public action boundary.
- `convex/lib/auth.ts` derives owner identity from Convex auth.
- `convex/lib/apply.ts` validates and writes assistant operations.
- `convex/account.ts` owns account deletion and Apple credential persistence.
- Vendor reporting from public actions should use `fetch` helpers or isolated
  internal actions; do not import Node-only SDKs into action modules that must
  run in the default Convex runtime.

## Verification

Run focused backend tests and typecheck:

```sh
npx vitest run convex
npx tsc -p convex/tsconfig.json
```

When live Groq, Apple, Sentry, or PostHog credentials are unavailable, record
the blocked live check and keep local tests on fake values or no-op seams.
