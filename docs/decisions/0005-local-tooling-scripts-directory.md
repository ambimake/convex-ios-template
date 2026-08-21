# 0005 — Local tooling scripts directory

Status: Accepted (template default)

## Context

A repo needs small local automation for repeatable development workflows that
are not product code, backend code, eval fixtures, or documentation — for
example a simulator-picking smoke runner, a readiness check, or a CI gate.

## Decision

Keep local development automation in a top-level `scripts/` directory, invoked
from package scripts or documented commands. Scripts must be narrow,
deterministic, and leave product runtime behavior unchanged; prefer explicit
environment-variable overrides for local setup differences.

## Consequences

- Package scripts share workflow guardrails without duplicating shell fragments.
- Local automation has a clear home outside product, backend, and eval source.
- A script that encodes a workflow sharp edge still needs a focused test or doc
  (this template's `scripts/*.test.mjs` pin that behavior).
