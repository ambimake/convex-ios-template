# 0002 — SwiftUI + Convex stack

Status: Accepted (template default)

## Context

The app is a native SwiftUI iOS client backed by a Convex TypeScript backend.
Convex owns user data, business logic, LLM/provider calls, validation, and auth.
Native code captures input (touch, voice), renders UI, and sends commands to
Convex through public actions. Agent-testable logic lives in TypeScript so CI
and cloud agents can iterate without a Mac; iOS verification still needs macOS
tooling (XCUITest, simulator smoke).

## Considered

- A cross-platform stack (e.g. Expo + Convex) with a web test target.
- A native client with a mobile-BaaS backend (e.g. Firebase).
- Separate apps with separate backends.

## Decision

Native SwiftUI for the client; Convex for the backend. The client never owns
domain writes — it calls public Convex actions, and server-owned mutations
persist state. Ownership is derived from Convex auth identity, never from
client-supplied IDs.

## Consequences

- Native Apple surfaces stay first-class: Siri/App Intents, widgets, Live
  Activities, on-device capture.
- The testable core stays in TypeScript; the Swift layer is a thin client over
  a public contract (shared fixtures pin the seam).
- Two languages coexist; keep the backend consumer-agnostic so a second client
  (another app, a web target) could reuse it.

Swap: if you don't need native Apple surfaces, a cross-platform client over the
same Convex backend is a reasonable alternative.
