---
name: ship-work
description: Use when preparing a PR, creating or updating it, handling review feedback, checking CI/review state, and closing the Linear issue after merge.
---

# Ship Work

Move completed implementation through PR, review, merge readiness, and tracker
closure.

## Inputs

Read:

1. `docs/workflow.md`
2. the Linear issue and linked plan
3. the Delivery Map node for PR/review work
4. the implementation diff
5. PR, CI, and review state when available

## Process

1. Verify the planned commands or record exact blockers.
2. Reconcile Delivery Map evidence before opening or updating a PR.
3. Inspect the diff against the base branch and confirm it matches scope.
4. Create or update the PR.
5. Wait for configured CI and reviewers to reach terminal state unless a
   check is clearly stuck.
6. Read top-level PR comments, latest reviews, inline threads, and check
   annotations. `gh pr checks` alone is not enough for review state.
7. Triage feedback:
   - fix valid small comments;
   - rebut incorrect comments with evidence;
   - defer valid large feedback into Linear follow-ups.
8. After fixes, push and repeat the wait/read/triage loop.
9. Before merge readiness, confirm checks, reviews, threads, mergeability,
   base branch, branch state, acceptance coverage, and Linear PR link.
10. After merge, close the Linear issue only when its own required acceptance
    is complete.

## Output

Return a terminal state:

- `Merged`
- `Merge-ready`
- `Blocked`
- `Deferred`

Include PR URL, verification evidence, review triage, deferred follow-ups, and
final Linear status.
