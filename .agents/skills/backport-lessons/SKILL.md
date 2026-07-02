---
name: backport-lessons
description: Use when pulling reusable lessons, skills, ADRs, or code from a source app checkout into this generic Convex+iOS template without leaking product specifics.
---

# Backport Lessons

Turn a source app's hard-won lessons into generic template assets. The template
is a clone-and-go foundation plus a reference layer; nothing product-specific
survives unless reworked into a product-agnostic form.

## Inputs

- A source-app checkout beside the template (e.g. `yaptask/`, `tmplt/`, `dotdot/`).
- The template's `docs/learnings/`, `docs/decisions/`, `.agents/skills/`.

## Selection rubric

Admit a candidate (learning, ADR, skill, code) only if it passes ALL four:

1. Product-agnostic — no source-app domain nouns. If stripping product context
   guts the lesson, drop it.
2. Recurring — you'd hit it again on the next Convex+iOS app.
3. Non-obvious / costly to relearn — a real mistake or a decision worth recording.
4. Stable — not tied to a churny internal choice.

## Disposition

Assign each candidate one of:

- Copy (rare) — already generic; take nearly verbatim.
- Rework (default) — strip specifics, swap in a neutral example.
- Drop — product-only or obvious.

Record the calls in a dispositions table (source path → disposition → rationale).

## Process

1. Enumerate candidates from the source checkout (recent commits + its skills /
   learnings / ADRs / scripts).
2. Score each against the rubric; write the dispositions table.
3. Rework accepted candidates into generic form.
4. Land in the right home and register:
   - learnings → `docs/learnings/` + index in `docs/learnings/README.md`
   - ADRs → `docs/decisions/` + index in `docs/decisions/README.md`
   - skills → `.agents/skills/<name>/SKILL.md` (+ `skills-lock.json` if sourced)
   - code → its natural dir, with a `docs/guides/<capability>.md` page
5. Verify: `npm run verify` green AND `node scripts/check-no-product-leak.mjs`
   clean. Extend the leak denylist in `scripts/check-no-product-leak.mjs` when a
   new source app is introduced.
