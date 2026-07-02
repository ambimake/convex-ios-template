# Evals

A generic, provider-pluggable LLM eval harness. Cases are JSON fixtures with
deterministic checks and an optional LLM-as-judge rubric.

## Commands

- `npm run evals:smoke` — runs every case through a deterministic mock provider,
  offline, no API key. Used in CI/verify.
- `npm run evals` — `--mode full`; runs against Claude. Requires
  `ANTHROPIC_API_KEY`.
- `npm run evals:smoke -- --fixtures extract-contact` — run selected cases.

## Layout

- `src/fixtures/data/*.json` — eval cases (id, prompt, checks, optional judge).
- `src/checks/` — deterministic checks + LLM-as-judge.
- `src/providers/` — provider interface, offline mock, Anthropic (fetch).
- `src/runner.ts` — runs cases through a provider and the checks.
- `src/report/scorecard.ts` — pass/total scorecard as markdown.
- `src/cli.ts` — `--mode smoke|full`, `--fixtures a,b`.

## Adding a case

Drop a JSON file in `src/fixtures/data/`. Keep prompts product-agnostic.
Add a provider vendor by implementing the `Provider` interface in
`src/providers/`.
