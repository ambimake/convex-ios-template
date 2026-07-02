# iOS Voice Pipeline Stage Ownership

Open before changing voice capture status, capture-phase priority, transcription
error display, or permission grant follow-through.

## One visible owner per active stage

Voice capture is a multi-stage session (permission → listen → transcribe →
submit). Each stage needs **one display owner**. Splitting pre-submit voice
failures across the capture coordinator and the generic submit-error channel
makes voice errors read as submit failures while stale success cards hide
in-flight work like "Transcribing".

Guardrail: failures before submission surface only through the voice coordinator
and its status card. Transcription helpers return results and keep analytics;
they do not write the generic submit-error message for voice-only failures.

## Explicit stage beats string heuristics

Do not infer voice priority from nullable fields plus free-form message strings
(e.g. requiring an empty transcript before showing "Transcribing"). That breaks
repeat-voice sessions where the prior result card is still visible.

Guardrail: the coordinator owns an explicit `VoicePipelineStage`
(`idle`/`listening`/`transcribing`/`failed`/`cancelled`) and the capture phase
prefers any non-`idle` voice stage over generic submit feedback.

## Permission flows must complete user intent

Granting mic permission after the rationale sheet is not success by itself — the
user already tapped mic. Dismissing without starting capture forces a second tap
and reads as a broken first-run loop.

Guardrail: on grant, dismiss the sheet **and** begin capture. Cover with a unit
test on the permission transition, not only the already-allowed path. See
[ios-permission-state-mapping](ios-permission-state-mapping.md).

## Terminal recovery closes the loop

Failed/cancelled cards need explicit recovery (Dismiss; Type-instead). Invalidate
the voice trace ID on recovery, or a late transcription can pass the trace guard
and auto-submit after the user backed out. Use leaf accessibility identifiers on
the recovery buttons, not row IDs that hide them.

## Narrow injection seam

Inject a small dependency bundle (contextual strings, transcribe, submit,
permission-fallback analytics, UI factories) rather than passing the whole app
model on hot paths. Defer a formal protocol until a second consumer appears.
