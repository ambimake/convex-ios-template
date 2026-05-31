# Workflow

Status: Template

This starter can use Linear as the operational tracker while Git stays the
source of truth for code, docs, skills, tests, and implementation plans.

## Configure

Before relying on the workflow skills, define the clone's tracker home:

- Linear workspace/team
- Linear project
- status vocabulary, for example `Backlog`, `Todo`, `In Progress`, `Done`,
  `Canceled`, `Duplicate`
- priority and label conventions
- base branch for PRs
- where implementation plans live, default `docs/plans/`

Do not keep the source app's team, project key, roadmap, or release-specific
language unless they are still true for the clone.

## Modes

- `choose-work`: select the next Linear issue and safe parallel lanes.
- `plan-work`: turn selected work into a branch-local plan and Delivery Map.
- `execute-work`: implement or verify the current Delivery Map node.
- `ship-work`: prepare PRs, handle review, verify merge readiness, and close
  Linear after merge.

## Source Of Truth

- Linear owns issue identity, status, assignee, priority, dependencies,
  active coordination, acceptance summaries, verification summaries, and PR
  links.
- Git owns code, durable docs, skills, tests, and plans.
- GitHub owns PR review, checks, threads, mergeability, and merge state.
- Delivery Maps own branch-local execution order, node status, gate attempts,
  changed paths, and evidence.

## Delivery Maps

Use a Delivery Map inside nontrivial `docs/plans/` files. Required gates that
are blocked by credentials, simulator state, CI, external access, or user
approval must stay blocked until passed, waived, or explicitly deferred.

When execution discovers a new review, verification, remediation, or human
intervention step, append a new Delivery Map node instead of hiding it in
notes.

## Completion

Do not mark a Linear issue done because local implementation passed if the work
requires PR review or merge. PR-backed work moves to `ship-work`; the issue
closes only after merge and acceptance evidence are complete.
