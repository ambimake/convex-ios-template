---
name: diagnose
description: Use when something is broken, throwing, flaky, slow, or regressing. Build a fast repro loop before guessing at fixes.
---

# Diagnose

## Loop

1. Reproduce with the smallest agent-runnable command.
2. Confirm the failure matches the reported symptom.
3. List 3-5 falsifiable hypotheses.
4. Probe one hypothesis at a time with targeted logs, tests, or a debugger.
5. Write a regression test at the seam that reproduces the real bug.
6. Fix, rerun the original repro, and remove temporary instrumentation.

## Preferred Repro Surfaces

- `npx vitest run convex/<focused>.test.ts`
- `npx tsc -p convex/tsconfig.json`
- `xcodebuild build-for-testing -project <project>.xcodeproj -scheme <scheme>`
- `xcodebuild test -project <project>.xcodeproj -scheme <scheme> -destination '<destination>'`
- `xcrun simctl install`, `launch`, and `io screenshot` for UI evidence

## Rules

- Do not hypothesize without a feedback loop unless you explicitly document why
  no loop is possible.
- Tag temporary logs with a unique prefix and remove them before completion.
- If simulator state is the blocker, record the exact command and CoreSimulator
  error instead of claiming tests passed.
