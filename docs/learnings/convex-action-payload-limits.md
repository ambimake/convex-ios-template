# Convex Action Payload Limits

Open before sending binary-ish data, base64 strings, or large JSON payloads
through Convex actions.

Convex validates value sizes before the action handler runs. Validation inside
the action is too late for values that exceed transport or encoded-value
limits.

When a client sends audio bytes as base64:

- calculate encoded size, not just raw byte count;
- remember base64 expands data by roughly 4/3;
- leave margin for action args and metadata;
- add a regression test proving the configured raw cap encodes below the Convex
  value limit;
- if the payload does not fit comfortably, use upload URLs, storage, or chunked
  transfer instead of raising the action cap.

Keep `MAX_VOICE_AUDIO_BYTES` comfortably below the raw 1 MB neighborhood so
`audioBase64` remains below Convex's encoded value limit.
