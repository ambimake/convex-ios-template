# Product Context

Status: Template

This file is the clone's product contract. Replace the bracketed guidance with
the actual app scope before shipping.

## North Star

`[App Name]` is a personal voice-agent app. A person speaks or types a short
request; the assistant turns it into validated operations against a small
domain model.

It is not a general AI assistant by default. Keep the first version narrow
enough that users can understand what will change when they submit a request.

## Launch User

Define the initial user in plain terms, but avoid overfitting the product
before usage data exists.

## Launch Target

- Native SwiftUI.
- iPhone-first.
- Convex TypeScript backend.
- Data and API contracts that can grow to iPad, macOS, or web later.

## Scope

Ship now:

- voice and typed capture;
- Sign in with Apple;
- one small example domain;
- trusted backend command interpretation;
- validated backend writes;
- account deletion;
- typed fallback when microphone access is unavailable.

Defer unless this clone explicitly needs it:

- collaboration;
- billing;
- reminders or calendar sync;
- broad admin tooling;
- session replay and feature flags;
- durable raw audio storage;
- general-purpose chat history.

## Product Model

Replace this with the clone's domain terms.

Starter default:

- A **Profile** owns app data.
- An **Entry** is a small saved item created from a typed or voice command.
- A **Command** is one voice or typed request.
- An **Assistant Operation** is a validated typed mutation emitted by backend
  command logic and applied by Convex.

## Command Surface

Users can speak naturally. The assistant should either emit validated
operations or ask for clarification. There is no closed grammar.

Keep command families close to the product model. Do not add broad assistant
capabilities until the product has a clear reason to support them.

## Trust And Recovery

Default to action when the change is clear. Clarify when the request is
ambiguous, destructive, unsupported, or based on unclear references.

For destructive or broad commands, either provide a preview, an undo/recovery
path, or a clear rejection until the clone has the needed safety model.

## App Store And Privacy Scope

Include:

- account deletion;
- Terms and Privacy links when required;
- microphone permission rationale at the moment of use;
- clear server-side transcription disclosure;
- typed fallback when voice permissions are denied;
- vendor analytics/crash reporting disclosures if enabled.

Do not store raw voice audio durably unless a future decision explicitly
changes that boundary.
