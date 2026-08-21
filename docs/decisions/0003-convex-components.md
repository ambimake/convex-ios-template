# 0003 — Convex component adoption

Status: Accepted (template default)

## Context

Convex Components isolate reusable backend capabilities but add real cost:
component calls cross isolates, run their own transactions, serialize arguments,
and add dispatcher latency. Adopting every component up front pays that overhead
before there is reuse pressure to justify it.

## Decision

Adopt a component only when isolation or cross-app reuse justifies the boundary
cost. Sensible early adopters:

- `@convex-dev/auth` — identity, which benefits from schema isolation.
- `@convex-dev/rate-limiter` — cap per-user LLM/provider cost.

Defer `workpool`, `agent`, `workflow`, `rag`, `crons`, and `migrations` until a
feature needs them. Until then, plain TypeScript modules under `convex/lib/` are
the right level of commitment.

## Consequences

- `auth` and `rate-limiter` earn their overhead through isolation and reuse.
- Deferred components have explicit triggers (async work → `workpool`, similarity
  search → `rag`, audited/retryable domain writes → a custom apply component).
- Don't build a custom component until a second consumer creates real reuse
  pressure.
