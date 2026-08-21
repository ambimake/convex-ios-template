# Convex Provider Test Mocking

Open before changing backend actions that call an LLM or transcription provider,
or the tests that exercise them.

Convex unit and action tests must not make live provider calls. Mock the provider
SDK at the module boundary (`vi.mock(...)`) and queue explicit completion or
transcription responses per call. This keeps `vitest` deterministic, avoids
spending API budget on ordinary verification, and makes red-green failures point
at backend behavior rather than provider availability.

Use the live provider only from the eval harness (`npm run evals:smoke` /
`npm run evals`), where model behavior is the thing being measured. If a Convex
test only passes because `.env.local` has a provider key, it's coupled to the
wrong boundary.

Recommended pattern:

- `vi.mock("<provider-sdk>", ...)` near the top of the test file.
- Queue one mocked completion per expected model turn, or one transcription
  response per request.
- Assert the **public** action behavior and persisted state, not private adapter
  internals.
- Keep provider-error and retry cases mocked with explicit status/code fields.

Cover both a success path and a non-success path (clarification, invalid input,
provider failure) — and assert the failure path persists **nothing** (no partial
mutation, no fabricated result).

For transcription specifically: a successful transcription returns text without
writing domain rows or raw audio; empty transcript and provider failure return
typed no-submit outcomes; telemetry omits raw audio, transcript text, prompts,
user content, and full provider responses. Treat every field derived from model
output as untrusted — trace only a whitelist and collapse unknown values to a
constant.
