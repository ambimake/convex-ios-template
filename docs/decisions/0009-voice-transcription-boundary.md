# 0009 — Voice transcription boundary

Status: Accepted (template default)

## Context

Voice is a multi-stage flow: microphone permission → capture → transcription →
submission. The question is where each stage runs and what may cross the backend
boundary.

## Decision

- **Swift owns** microphone permission, short audio capture, cancellation, and
  voice UI.
- **Trusted backend code owns** the transcription call to the provider and
  returns a transcript.
- The transcript then enters the **same public write path** as typed input —
  transcription itself never mutates domain data. There is exactly one
  assistant/user-data write boundary.
- On-device speech recognition may remain as a fallback, fixture source, or
  comparison baseline, but the server-side provider is the default quality path.

## Guardrails

- Do not store raw audio in backend tables, history, usage events, or telemetry.
- Usage events may record provider, model, duration, latency, status, and a
  coarse error code — never raw audio, prompts, full responses, or user content.
- Raw-audio size must account for base64 expansion before it reaches a backend
  action (see [convex-action-payload-limits](../learnings/convex-action-payload-limits.md));
  if short audio can't fit under the encoded value limit, use an upload/storage
  path instead of raising the action arg cap.
- A typed fallback (keyboard) stays available when permission is denied,
  transcription fails, or the network/provider is unreachable.

## Consequences

Short audio may cross the backend boundary for transcription only. Privacy copy
and permission rationale must account for server-side transcription. Swap the
provider by keeping this boundary and the raw-audio guardrails.
