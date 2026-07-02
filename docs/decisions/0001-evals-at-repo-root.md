# 0001 — Evals at repo root

Status: Accepted (template default)

## Context

AI features need repeatable, reviewable quality measurement independent of the
app runtime (SwiftUI / Convex). Burying evals inside app code couples them to
build tooling and makes them hard to run in CI.

## Decision

This template puts evals in a top-level `evals/` directory with its own
`tsconfig.json`, run via `tsx`. Cases are JSON fixtures with deterministic
checks plus an optional LLM-as-judge rubric. A deterministic mock provider makes
`evals:smoke` run offline in CI; a fetch-based Claude provider powers `--mode
full` when a key is present.

Dispositions from the source-app backport that produced this harness: the runner
/ checks / judge / providers / report / CLI shape were **reworked** into generic
form; the source app's task-list domain model, strategy implementations, and
fixtures were **dropped**.

## Consequences

- Evals run without the iOS/Convex toolchain and without secrets in CI.
- Swap the provider for another model vendor by implementing the `Provider`
  interface. Swap the harness out entirely if you adopt a hosted eval platform.
