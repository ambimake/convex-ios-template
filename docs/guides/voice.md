# How this template does voice

Voice is a multi-stage flow — permission → capture → transcription → submission
— with clear ownership at each stage. See
[ADR 0009](../decisions/0009-voice-transcription-boundary.md).

- **Swift owns** mic permission, short audio capture, cancellation, and voice UI.
- **Backend owns** the transcription call; the transcript re-enters the normal
  public write path. Transcription never mutates domain data directly.
- One visible **stage owner**: model an explicit `VoicePipelineStage`
  (`idle`/`listening`/`transcribing`/`failed`/`cancelled`) rather than inferring
  state from nullable fields and free-form strings. Pre-submit failures surface
  through the voice coordinator only, not the command-error channel.
- **Complete user intent** on permission grant: if the user already tapped mic,
  granting permission dismisses the rationale sheet *and* starts capture — no
  second tap.
- **Terminal recovery**: failed/cancelled cards offer Dismiss and Type-instead;
  invalidate the voice trace ID so a late transcript can't auto-submit after the
  user backed out.

Privacy guardrails and payload-limit math live in
[voice-pipeline-stage-ownership](../learnings/voice-pipeline-stage-ownership.md),
[convex-provider-test-mocking](../learnings/convex-provider-test-mocking.md), and
[convex-action-payload-limits](../learnings/convex-action-payload-limits.md).

The template already scaffolds voice capture and transcription; this guide is the
reusable shape to preserve as the domain changes.
