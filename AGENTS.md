# Agent Rules

Status: Template

This starter is a SwiftUI iOS app backed by a Convex TypeScript backend. Read
`README.md` for orientation, `CONTEXT.md` for product scope, `BRAND.md` before
writing product copy, `ENGINEERING.md` for implementation principles,
`docs/architecture.md` for system boundaries, `docs/deployment.md` for setup
and secrets, and `.agents/learnings/README.md` before changing backend, voice,
analytics, or simulator verification paths.

## Hard Rules

- Assistant-driven data writes start at `convex/commands.ts:submitCommand`.
  Interpret input, validate typed operations, then apply them through the
  server apply layer.
- User ownership comes from Convex auth via `convex/lib/auth.ts`; never trust a
  client-supplied user ID.
- Keep public Convex actions in `convex/commands.ts` unless a new decision
  explains why another public action module is needed.
- Keep database writes in `convex/lib/apply.ts` and `convex/account.ts` unless
  a new decision approves another write boundary.
- Swift handles input and display. Voice transcription, command interpretation,
  validation, and trusted model-provider calls live in Convex.
- Do not commit live secrets, Apple private keys, generated client secrets, API
  tokens, deployment IDs, or filled local env files.
- Do not store raw voice audio durably.

## Where To Edit

- SwiftUI app shell: `ios/App/`
- Native capture UI/state: `ios/Features/Capture/`
- Settings/account deletion UI: `ios/Features/Settings/`
- Swift configuration and service seams: `ios/Core/`
- Swift unit tests: `ios/Tests/`
- Public command actions: `convex/commands.ts`
- Generic entry domain: `convex/entries.ts`
- Server-owned write layer: `convex/lib/apply.ts`
- Account lifecycle: `convex/account.ts`
- Backend tests: `convex/*.test.ts`

## Agent Skills

- Use `.agents/skills/tdd` for feature work with clear behavior.
- Use `.agents/skills/diagnose` for bugs, broken checks, or regressions.
- Use `.agents/skills/choose-work`, `plan-work`, `execute-work`, and
  `ship-work` for Linear-backed tracker workflow. Configure the clone's Linear
  team/project in `docs/workflow.md`; do not reuse source-app tracker IDs by
  default.
- Use `.agents/skills/convex-voice-agent` before changing Convex command,
  auth, voice transcription, Sentry, PostHog, or account lifecycle code.
- Use `.agents/skills/ios-voice-template` before nontrivial SwiftUI, capture,
  settings, or simulator verification work.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
