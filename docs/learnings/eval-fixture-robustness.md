# Eval Fixture Robustness

Open before writing eval fixtures or judge rubrics.

- Keep fixtures product-agnostic: a fixture that encodes one app's domain nouns
  cannot be reused and will trip the no-product-leak gate.
- Prefer a deterministic check (regex / jsonPath / contains) as the primary
  signal and use the LLM judge as a secondary rubric, not the only gate — judges
  are noisy and non-deterministic.
- Extract JSON defensively: models wrap JSON in prose. Slice from the first `{`
  to the last `}` before parsing rather than assuming the whole output is JSON.
- Make smoke runs offline. A mock provider keyed by prompt substring lets CI
  exercise the whole pipeline without a key or network flake.
