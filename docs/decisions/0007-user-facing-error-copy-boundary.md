# 0007 — User-facing error copy boundary

Status: Accepted (template default)

## Context

Errors cross a boundary: the backend knows the precise failure category; the
client knows how to present it. If the backend ships raw internal messages to
the UI, copy leaks implementation detail and drifts; if the client invents copy
from opaque failures, it guesses.

## Decision

The backend returns **structured, typed error categories** (a stable code plus
safe, minimal context) — not user-facing prose. The client owns the mapping from
error category to user-facing copy, in one presentation layer. A single place on
the client validates and renders error messages so no raw backend string reaches
the user unmapped.

## Consequences

- Backend error semantics and UI copy evolve independently; neither guesses.
- Copy for a given failure lives in one place and is reviewable.
- New failure modes add a category on the backend and a copy mapping on the
  client, in the same change — a missing mapping is a visible gap, not a leaked
  internal string.
