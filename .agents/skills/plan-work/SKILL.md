---
name: plan-work
description: Use when turning selected Linear work into an executable repo plan with acceptance criteria, verification, dependency ordering, concurrency notes, and a Delivery Map.
---

# Plan Work

Turn selected Linear work into a plan another agent can execute.

## Inputs

Read:

1. `docs/workflow.md`
2. the selected Linear issue and comments
3. `AGENTS.md`
4. relevant current-truth docs such as `README.md`, `docs/architecture.md`,
   and `docs/deployment.md`
5. `.agents/learnings/README.md`, then only relevant entries
6. area skills such as `tdd`, `convex-voice-agent`, or `ios-voice-template`

## Plan Shape

Write plans under `docs/plans/`, normally named with the Linear issue key.
Include:

- goal and non-goals;
- ship-now/defer boundary when scope could grow;
- observable acceptance criteria;
- verification commands and manual checks;
- TDD/debugging/execution skill choice;
- relevant learnings applied;
- dependency ordering and safe concurrency;
- durable documentation impact;
- visual evidence plan for UI-facing work.

## Delivery Map

Every nontrivial plan should include `## Delivery Map` with nodes containing:

- `id`, `mode`, `status`, `owner_type`, and `executor`;
- planned write scope;
- `depends_on` and `unblocks`;
- required gates with commands, status, evidence, and attempts;
- human gates when approval, credentials, or external access are needed;
- notes, todos, issues found, actual changed paths, and actual evidence;
- `next`.

Linear owns issue status, assignee, dependencies, and PR links. GitHub owns PR
review/check state. The Delivery Map owns branch-local execution order and
evidence.

## Output

Link the plan path, summarize acceptance and verification, state relevant
learnings checked, list Linear updates made, and name the next skill.
