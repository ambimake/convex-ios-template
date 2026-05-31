# Engineering Principles

Status: Template

Use these principles to keep the starter small, testable, and safe to clone.

## Product Fit First

Prefer fast capture, clear results, and low maintenance over generic platform
features. Add machinery only when it directly improves the product loop or
release confidence.

## Scope Brake

Before adding diagnostics, admin tooling, abstractions, dashboards, billing,
or broad integrations, ask what user action, release decision, or quality risk
the work unblocks.

Write down:

- Ship now
- Defer

## Test Outside In

Start with observable behavior:

- Convex action response and persisted state;
- Swift request encoding and state transitions;
- simulator build/test/screenshot evidence;
- privacy boundaries for analytics payloads.

Add narrower unit tests after the behavior is protected.

## Build Testable Boundaries

Keep a pure core and a messy shell.

- Command logic validates structured operations before writes.
- Voice capture becomes transcript input before command execution.
- Vendor calls sit behind small fetch-based helpers or test seams.
- Swift UI state has pure mappable states for permissions and request
  encoding.

## Make Invalid States Hard

Use TypeScript validators, Swift enums, discriminated unions, and focused
types. Avoid client-supplied ownership, stringly typed status, nullable
everything, and partially valid operation envelopes.

## Let Failures Propagate

Do not hide failed operations behind broad defaults. Catch errors only when
there is a specific response: retry, user-facing message, compensating action,
or process-boundary reporting.

## Privacy By Default

Do not send transcripts, entry content, raw audio, Apple refresh tokens, or
other private user-authored content to analytics. Crash/error reporting should
include enough context to debug without exposing product content.

## Automate The Bar

Keep standard checks easy to run:

```sh
npx vitest run convex
npx tsc -p convex/tsconfig.json
xcodebuild build -project VoiceAgentTemplate.xcodeproj -scheme VoiceAgentTemplate -destination 'platform=iOS Simulator,OS=18.5,name=iPhone 16'
xcodebuild test -project VoiceAgentTemplate.xcodeproj -scheme VoiceAgentTemplate -destination 'platform=iOS Simulator,OS=18.5,name=iPhone 16'
```

Record exact blockers when credentials, Apple Developer state, or simulator
state prevents a required check.

## Document Expensive Context

Write down hard-to-rediscover boundaries, deployment setup, vendor caveats,
simulator failures, and design decisions in docs or learnings. Do not leave
them only in chat.
