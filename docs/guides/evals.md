# How this template does evals

Evals live in `evals/` and measure AI output quality independently of the app.

- Author cases as JSON in `evals/src/fixtures/data/` (id, prompt, deterministic
  checks, optional judge rubric).
- `npm run evals:smoke` proves the pipeline offline; `npm run evals` runs against
  Claude.
- Add a model vendor by implementing the `Provider` interface in
  `evals/src/providers/`.

Future extension: a private/encrypted fixture set for sensitive prompts (keep
them out of git) — not included in the base template.
