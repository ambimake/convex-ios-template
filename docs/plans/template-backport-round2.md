# Template Backport — Round 2 (remaining verticals)

> Continues the loop established in
> `docs/plans/template-backport-framework-evals.md` using the
> `.agents/skills/backport-lessons` rubric. Round 1 shipped the framework +
> evals (PR #13). Round 2 covers the remaining areas.

**Goal:** Backport the remaining generic, reusable assets from the source-app
checkouts (yaptask / tmplt / dotdot) into the template's reference layer and
skill pack, product-agnostic, verified by `npm run verify` + the
no-product-leak gate.

## Scope (this round)

1. **Generic ADRs** → `docs/decisions/` — rework the genuinely-generic yaptask
   ADRs as swappable template defaults (swiftui-convex stack, convex components,
   scripts dir, observability split, agent-skills dir, codex-agents dir,
   telemetry/usage events, error-copy boundary). Drop product ADRs.
2. **Workflow skills** → `.agents/skills/` — add generic skills missing from the
   template (compound-learning, create-pr, handoff, review-panel, shape-work,
   sprint-brief, prototype, real-device-debug, write-a-skill, zoom-out,
   ubiquitous-language, grill-me). Strip Linear/AMB and product coupling; keep
   the template's tracker-agnostic posture.
3. **Voice vertical** → learnings + ADR + `docs/guides/voice.md`. Template
   already scaffolds voice; this adds the reusable pipeline/ownership lessons.
4. **Auth / sign-in vertical** → learnings + ADRs + `docs/guides/auth.md`
   (Apple Sign In, Convex identity ownership, data-security boundary).
5. **Payments vertical** → ADRs + `docs/guides/payments.md` + learnings for
   Apple subscription entitlements and gating. Full StoreKit/iOS code is a
   later focused project, not fabricated here.
6. **Ad attribution vertical** → survey first; extract generic guidance only if
   a source app actually implements it, else record it as a documented gap.

## Rubric (unchanged)

Admit only product-agnostic, recurring, non-obvious, stable assets →
Copy / Rework (default) / Drop. Record dispositions inline.

## Non-goals

- Fabricating untested iOS payment/attribution code into the template.
- Product-specific ADRs, learnings, or skills (Linear-coupled, domain nouns).
- Changing the evals harness or round-1 framework.

## Validation

`npm run verify` (typecheck + no-product-leak gate + tests) green; new guides
and reference files land with README index updates; leak gate stays clean.
