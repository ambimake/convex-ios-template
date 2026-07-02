---
name: create-pr
description: Create or update a GitHub pull request from the current worktree while respecting user-provided PR instructions. Use when the user asks to create a PR, open a pull request, publish a branch, or when PR instructions are attached.
---

# Create PR

Publish the current branch as a pull request without broadening the branch
scope.

## Inputs

Read:

1. Any attached PR instructions from the user or harness.
2. `docs/workflow.md` and the relevant tracked issue or linked plan when this is
   tracked work.
3. `git status -sb`.
4. `git diff` for unstaged changes and `git diff --cached` for staged changes.
5. `git diff origin/main...` after pushing, or the target branch named by the
   instructions.

## Draft Policy

- Respect explicit user or attached instructions over generic defaults.
- Create a normal PR when the user says "create a PR" and no instruction says draft.
- Create a draft PR only when the user or attached instructions say draft, WIP,
  not ready, or when verification/scope is blocked and the user still wants a PR.
- Do not inherit a third-party skill's "draft by default" behavior when it
  conflicts with the user's instructions.

## Workflow

1. Confirm scope from the worktree diff. Stage only intended paths; never stage
   user-owned unrelated files silently. For tracked work with a linked or
   in-scope `docs/plans/` plan, verify `ship-work`'s terminal artifact pass and
   durable handoff already happened before committing or pushing; if not, route
   back through `ship-work`.
2. Confirm branch and target. Do not rename the current branch. Use the target
   from instructions; otherwise `main`.
3. Commit intended changes with a terse message.
4. Push with upstream tracking when needed.
5. Review `git diff <target>...` and confirm the PR diff matches scope.
6. Create the PR with `gh pr create --base <target>`. Add `--draft` only when the
   Draft Policy says to. Title under 80 chars unless instructed. Body concise,
   describing the full branch diff, not only the latest commit.
7. Report the PR URL, branch, commits, verification, and any uncommitted
   unrelated changes left behind.

When invoked from `ship-work`, creating/updating the PR is a handoff point inside
the shipping flow, not a terminal state — return the PR URL and branch so
`ship-work` can continue its wait/read/triage loop and merge-readiness gate.

## Body Template

```md
Summary sentence covering the branch diff.
Second sentence for why it matters or the user/developer impact.
Third sentence for validation commands.
Optional final sentence for known warnings, blockers, or deferred scope.
```
