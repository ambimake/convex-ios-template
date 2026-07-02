---
name: shape-work
description: Shape high-level strategy, scope, and phasing before tactical implementation planning. Use when work is fuzzy, has architectural/product tradeoffs, may need splitting, or the user asks about direction, posture, sequencing, vendors, boundaries, or what should be in or out of scope.
---

# Shape Work

Turn strategic uncertainty into a shaped issue that is ready for `plan-work`.

Use this before `plan-work` when the main question is not "what files and tests
come next?" but "what are we trying to do, why, in what phase, and what are we
not doing yet?"

Also use this as a direction-review checkpoint when recent work has become
infrastructure-heavy or tracker-heavy enough that the user-facing impact is no
longer obvious. In that case, first translate the current work into the product
loop from `CONTEXT.md`, then identify whether the next decision is about product
direction, architecture posture, release confidence, or execution sequencing, or
whether the issue is only tracker wording.

## Inputs

Read only what is needed. Prefer the repository's own orientation docs and
tracker conventions when they exist:

1. repo instructions such as `AGENTS.md`, `CLAUDE.md`, or equivalent
2. documentation maps such as `README.md`, `docs/README.md`, or equivalent
3. product/domain context docs such as `CONTEXT.md`, product specs, or glossary
4. engineering/architecture principles such as `ENGINEERING.md`,
   `docs/architecture.md`, decision records, or design docs
5. the selected tracker issue, related issues, labels, dependencies, comments,
   project/cycle, status, and priority
6. the current plan file, if a tactical plan already exists and may need revision
7. nearby code only when it can answer a shaping question better than asking the
   user

## Default Artifact Homes

Use the repo's documented conventions first. If none exist, default to this
simple structure:

- `README.md`: repo orientation.
- `AGENTS.md`: hard agent rules.
- `CONTEXT.md`: product/domain truth.
- `docs/architecture.md`: current system shape and boundaries.
- `ENGINEERING.md`: engineering principles.
- `docs/workflow.md`: workflow rules and the operational tracker of record.
- `docs/roadmap.md`: phases, sequencing, progress, and deferred decisions.
- `docs/plans/`: detailed tactical implementation plans linked from the tracker.
- `docs/decisions/`: durable product, architecture, and engineering decisions.
- `docs/guides/`: short "how this app does X" capability pages.
- `docs/learnings/`: reusable lessons and runbooks.

Prefer singular docs for current truth and subdirectories for repeated artifacts.

## Process

1. Restate the shaping question in project vocabulary.
2. Identify what level is unresolved: strategy/posture; product scope;
   architecture boundary; vendor/tool choice; phasing/dependency order; work-item
   split or ownership.
3. Gather evidence from docs or code before asking the user anything the repo can
   answer.
4. If the decision tree is still unclear, interview the user one question at a
   time. For each: explain why it matters; provide your recommended answer; wait
   for the user's response before moving to the next branch.
5. Challenge fuzzy or conflicting terms against `CONTEXT.md`. When terminology
   ambiguity becomes a primary blocker, use `ubiquitous-language` first.
6. Stress-test the direction with concrete scenarios, especially edge cases that
   change scope, sequencing, cost, privacy, support, or operational risk.
7. Run a decomposition check before narrowing scope. Split the issue instead of
   only trimming it when it contains separate user actions, release decisions,
   owners, verification paths, or blocker-class risks that can move independently.
   Split signals: one item owns both code and external/legal/metadata
   coordination; one item touches several unrelated app surfaces; one item needs
   different verification modes (App Store review, device smoke, backend tests,
   legal review, scripts); the ship-now list depends on several unrelated "and"
   clauses; separate agents could work safely with clearer ownership.
8. During pre-MVP and beta-readiness work, apply the Pre-MVP Scope Brake from
   `ENGINEERING.md` before tactical planning: name the user action, release
   decision, or core-loop quality issue the work unblocks; separate `Ship now`
   from `Defer`; challenge platform machinery, broad diagnostics, admin tooling,
   abstractions, all-cases coverage, and always-on collection unless they
   directly reduce current release risk. If the smallest useful slice is not
   clear, keep shaping instead of handing off.
9. Present two or three viable approaches with tradeoffs and a recommendation.
10. Decide the artifact: narrow scope on the existing issue; split new issues for
   separate slices; update durable product/architecture/strategy docs when
   posture changes; propose a decision record only when the decision is
   hard-to-reverse, surprising without context, and based on a real tradeoff;
   update `CONTEXT.md` only for resolved domain language; create a new skill only
   for a repeated procedure not already covered by the existing skills.
11. Keep dependency ordering (`Blocked by`/`Blocks`) separate from execution
   concurrency (`Can run alongside`, whether the item stays single-owner or can
   split by layer/files/research).
12. Stop before tactical implementation planning unless the shaped slice is now
   clear. Then hand off to `plan-work`.

## Subagent Use

Optional read-only scout subagent for evidence gathering across the tracker,
roadmap, decisions, and product docs. The parent runs the user interview, makes
the strategic call, and owns tracker updates, current-truth docs, and
decision-record proposals. For direction/scope/posture questions, the parent may
run a multi-perspective `review-panel` on the candidate approach before detailed
planning — shaping is the cheapest point to cut scope, so contrarian critique
pays off most here. Carry only the surviving approach into `plan-work`.

## Outputs

A concise shaping summary: recommended strategy/posture; explicit non-goals and
deferred decisions; issue changes to make or made; docs or decision-record
updates needed; phasing, blockers, and concurrency; whether the next skill is
`plan-work`, another `shape-work` pass, or a focused `ubiquitous-language`
session.

## Review Checklist

- The output answers the strategic question rather than jumping to files/tests.
- Fuzzy terms were reconciled with project vocabulary.
- Repo evidence was checked before asking discoverable questions.
- The recommended approach names tradeoffs, not just preferences.
- Pre-MVP work has a `Ship now`/`Defer` boundary and names what it unblocks.
- Overloaded issues were split when they combined independent owners, release
  decisions, verification paths, or blocker-class risks.
- Scope, phasing, blockers, and concurrency are separated.
