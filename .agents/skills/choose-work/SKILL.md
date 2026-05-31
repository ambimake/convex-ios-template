---
name: choose-work
description: Use when selecting the next Linear issue, reviewing current focus, or deciding which work can run in parallel before planning.
---

# Choose Work

Pick the next useful slice from Linear and repo context.

## Inputs

Read:

1. `docs/workflow.md`
2. the configured Linear team/project issues, statuses, priorities,
   dependencies, assignees, cycles, and labels
3. linked `docs/plans/` files when present
4. relevant product, architecture, deployment, and learning docs

## Process

1. Identify current focus, blocked items, active owners, and likely parallel
   worktree capacity.
2. Prefer issues that are small, unblocked, verifiable, and aligned with the
   current product/release goal.
3. Keep dependency ordering separate from execution concurrency:
   `Blocked by` means another issue or decision must finish first; `Can run
   alongside` means the work can proceed without ownership conflict.
4. If an issue is vague, route it to `plan-work` only after scope, acceptance,
   and verification are clear enough.
5. Update only the selected issues in Linear: status, assignee, project/cycle,
   dependencies, and concise ownership comments.

## Output

Return the selected primary issue, why it is next, safe parallel lanes if any,
blocked/deferred items, Linear updates made or needed, and the next skill for
each lane.
