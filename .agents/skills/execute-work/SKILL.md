---
name: execute-work
description: Use when implementing or verifying a planned Linear issue, advancing a Delivery Map node, recording evidence, and deciding whether the work is complete, blocked, or ready for shipping.
---

# Execute Work

Implement the current Delivery Map node and record evidence.

## Inputs

Read:

1. `docs/workflow.md`
2. the Linear issue and linked plan
3. the plan's `## Delivery Map`
4. `AGENTS.md`
5. relevant area skills and learnings

## Process

1. Confirm upstream `depends_on` nodes are done, waived, or explicitly
   deferred. Do not advance through blocked required gates.
2. Move or comment the Linear issue as `In Progress` when claiming work.
3. Execute one Delivery Map node before moving to its `next` node.
4. Keep edits inside planned ownership. If reality changes the graph, append a
   new node with `origin: discovered_during_execution`, required gates,
   evidence, dependencies, and next node.
5. Run planned verification or record the exact blocker: command, error,
   missing prerequisite, and owner needed to unblock it.
6. For UI work, capture screenshots or explain why visual evidence is not
   applicable.
7. Before stopping, update the Delivery Map node with actual changed paths,
   actual evidence, gate attempts, and final node status.
8. Update Linear with concise evidence, blocker state, and next step.

## Completion Gate

Before claiming completion, check:

- all required acceptance criteria have passed, been waived, or been
  explicitly deferred;
- required evidence is recorded in the plan and/or Linear;
- blocked checks are not described as passing;
- dynamic review, verification, or human-intervention stages are modeled as
  Delivery Map nodes;
- PR-backed work remains open until `ship-work` handles PR review and merge.

## Output

Report the current node, next node or terminal state, changed files,
verification evidence, Linear status, blockers, and whether `ship-work` should
run next.
