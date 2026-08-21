---
name: compound-learning
description: Use after completing work to decide whether reusable lessons, Delivery Map patterns, workflow docs, tests, evals, or playbooks should be updated.
---

# Compound Learning

Preserve lessons that should improve future work.

## Inputs

Read:

1. the completed issue, plan, Delivery Map, or PR notes
2. `docs/workflow.md`
3. `docs/learnings/README.md`
4. the repo documentation map, when one exists, such as `docs/README.md`
5. current-truth docs relevant to the completed work, such as `CONTEXT.md`,
   `docs/architecture.md`, `ENGINEERING.md`, `docs/roadmap.md`, or decision records
6. relevant tests, evals, docs, or incidents

## Process

1. Identify what was surprising, repeated, expensive, or easy to forget.
   Include Delivery Map friction: missing nodes, unclear gates, stale source
   refs, human-gate ambiguity, or evidence that was hard to recover.
2. Classify the durable artifact before editing:
   - leave issue-local why, active coordination, acceptance/verification
     summaries, blockers, waivers, follow-ups, and terminal result notes in the
     tracker's evidence;
   - leave PR-local diff explanation, CI state, review threads, and mergeability
     in GitHub evidence;
   - update singular current-truth docs when the work changes product scope,
     system shape, engineering posture, roadmap state, or workflow rules;
   - create or update a decision record when two or more are true:
     cross-cutting, hard to reverse, future work must obey it, rejected
     alternatives remain tempting, ownership or source-of-truth boundaries
     change, persisted data or user-visible domain semantics change, or a new
     enforcement rule is created;
   - add tests, evals, scripts, configuration, or type checks when the lesson
     can be enforced mechanically;
   - update a skill when future agents should follow a different procedure;
   - use `ubiquitous-language` first when the reusable lesson is that project
     terms were ambiguous, overloaded, or inconsistent across docs;
   - add `docs/learnings/` entries for reusable runbooks, sharp edges, or
     patterns that do not belong in current-truth docs;
   - retain a compact plan only by exception, when a repo-durable fact would be
     lost and no better artifact owns it;
   - choose no durable artifact for reversible local implementation choices,
     obvious code organization, one-off failed attempts, and decisions whose
     rationale is clear from the final diff, tests, or PR.
3. Check the relevant singular docs before defaulting to `docs/learnings/`.
4. Prefer programmatic guardrails over prose when possible:
   - move repeated commands into scripts with safe defaults;
   - encode sharp edges in config, types, validators, generated files, tests,
     or evals;
   - keep escape hatches explicit, for example an environment-variable override.
5. Use prose to explain why a guardrail exists, when to look for it, or when it
   cannot be encoded safely.
6. Avoid recording one-off status updates or implementation trivia.
7. If the work showed the Delivery Map structure itself needs a reusable change,
   update `docs/plans/README.md`, `docs/workflow.md`, or the relevant workflow
   skill instead of burying it in a learning note.
8. Add or update the smallest durable artifact that changes future behavior.

## Output

State what was learned, which durable artifact classes were considered, what
artifact changed, why current-truth docs did or did not change, and any
follow-up tracked. Include whether the Delivery Map helped, drifted, or needs a
workflow/schema follow-up.
