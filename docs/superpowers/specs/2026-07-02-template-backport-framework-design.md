# Template Backport Framework + Evals Proof Vertical

Date: 2026-07-02
Status: Approved (design)
Branch: `ambisrc/backport-yaptask-lessons`

## Problem

Building a new Convex + iOS app means re-solving the same things every time —
sign-in, payments, voice, evals, ad attribution, deployment secrets, CI gates —
and getting them subtly wrong. We have a mature source of hard-won lessons in
`yaptask/` (22 workflow skills, 57 learnings, 38 ADRs, a full eval harness, PR
gate scripts), but that knowledge is braided with YapTask *product* specifics
(List Memory, shared lists, subscription gating, command prompts).

We want the `convex-ios-template` to be a **guide / starter / foundation**: a
clone-and-go scaffold **plus** a reference layer (learnings + ADRs) that a new
project can lean on. Everything must be **generic**. Nothing YapTask-specific
survives unless it is reworked into a product-agnostic form.

## Goal of this pass

Do **not** bulk-copy. This pass ships the reusable *machine* plus one proof:

1. A **selection rubric** — what earns a place in a generic template.
2. A repeatable **backport skill** — so rounds 3, 4… are cheap and consistent.
3. A **no-product-leak gate** — a script that fails if product tokens appear.
4. **Evals as the proof vertical** — run the whole loop end-to-end once.

Later verticals (voice, auth, payments, ad attribution) are repetitions of the
same loop and are explicitly **out of scope** here.

## Non-goals

- Extracting voice / auth / payments / attribution (future passes).
- Copying any of the ~30 product-specific ADRs or product-specific learnings.
- Changing the iOS app target or Convex schema beyond what evals needs.
- A perfect, exhaustive eval harness — a working generic one that runs.

---

## 1. Selection rubric

A candidate (learning, ADR, skill, or code) is admitted only if it passes **all
four**:

1. **Product-agnostic** — no YapTask domain nouns (List Memory, shared lists,
   command prompts, tasks). If stripping product context guts the lesson, drop it.
2. **Recurring** — you'd hit it again on the *next* Convex + iOS app.
3. **Non-obvious / costly to relearn** — encodes a real mistake or a decision
   you'd otherwise re-agonize over. Not "use TypeScript."
4. **Stable** — not tied to a churny internal choice.

Each candidate gets one **disposition**:

- **Copy** (rare) — already generic; take nearly verbatim.
- **Rework** (common, the default) — strip product specifics, re-example against
  a neutral domain.
- **Drop** — product-only or obvious.

Default disposition for yaptask learnings/ADRs is **Rework**, never Copy.

---

## 2. Reference-layer structure (decision D1)

Consolidate onto yaptask's locations; retire the template's split
`.agents/learnings/`.

| Location | Holds |
|---|---|
| `.agents/skills/` | Generic workflow + capability skills (reworked) |
| `docs/learnings/` | Generic learnings, with a categorized `README.md` index |
| `docs/decisions/` | Generic **template-default ADRs** (see §3) |
| `docs/guides/<capability>.md` | One short "how this app does X" page per vertical |

Migration: move the template's existing 6 notes from `.agents/learnings/` into
`docs/learnings/` (reworking any that are too specific), then delete
`.agents/learnings/`. Update any references.

---

## 3. Generic ADRs (decision D2)

Keep the ADR *format*, but rewrite the genuinely-generic decisions as
**swappable template defaults**: *"this template chooses X; here's why; swap it
for Y if you need to."* Product-specific ADRs are **Dropped**.

Candidate generic ADRs to rework (final list decided during planning):
`0001-swiftui-convex-stack`, `0003-convex-components`, `0004-evals-at-repo-root`,
`0014-local-tooling-scripts-directory`, `0016-observability-split`,
`0008-agent-skills-directory`, `0017-codex-agents-directory`.

This pass only *needs* to land the **evals-at-repo-root** ADR (proof vertical);
the rest can be a short follow-up batch.

---

## 4. The repeatable backport skill

New skill: `.agents/skills/backport-lessons/SKILL.md`. Codifies the loop:

1. **Enumerate** candidate assets from a source repo (recent commits + its
   skills / learnings / ADRs / scripts).
2. **Score** each against the §1 rubric → Copy / Rework / Drop with a one-line
   rationale (a dispositions table is the working artifact).
3. **Rework** — strip domain nouns, swap in a neutral example.
4. **Land** in the correct template location + register it (skills-lock,
   learnings index, ADR index).
5. **Verify** — build/tests green **and** the no-product-leak gate passes.

The skill is the durable deliverable: every future backport round runs it.

---

## 5. No-product-leak gate

New script `scripts/check-no-product-leak.mjs` (+ a `.test.mjs`):

- Greps the tracked template tree for a configurable denylist of product tokens
  (`YapTask`, `yaptask`, `List Memory`, `List Instruction`, `AMB-\d+`, etc.).
- Excludes the reference `yaptask/`, `tmplt/`, `dotdot/` checkouts and this spec.
- Exits non-zero with the offending file:line on any hit.
- Wired into the template's verify script so CI/agents catch leaks automatically.

The denylist lives in one obvious place so future verticals extend it.

---

## 6. Proof vertical: evals (decision D3)

Extract `yaptask/evals` into a **generic, provider-pluggable LLM eval harness**
under `evals/` in the template.

**Extract & rework (generic):**

- `runner.ts`, `cli.ts` — the run loop and CLI modes (smoke / full / scorecard /
  compare / trend).
- `checks/deterministic.ts`, `checks/judge.ts` — deterministic + LLM-judge checks.
- `providers/` — rework `groqClient` / `judgeClient` into a **provider
  interface** with a documented default. (Provider choice — Claude vs Groq vs
  pluggable-only — is a planning detail; the interface is what matters.)
- `report/` — `scorecard`, `compare`, `trend`, `json`, `markdown`, `types`.
- `fixtures/loader.ts`, `fixtures/types.ts` — fixture loading.
- `validators/common.ts` — generic validators; drop task-schema validators.
- `hidden/` — the **encrypted private-fixture pattern** (keep sensitive eval sets
  out of git) is genuinely reusable; rework generically. May land as an optional
  follow-up if it bloats the pass — planning decides.

**Drop (product-specific):**

- `core/{applyOperations,operations,taskListModel}.ts`
- `instructionSuggestions/*`
- `fixtures/data/*.json` (task-list fixtures)
- task-list strategy impls (`diffWholeList`, `wholeListReplacement`,
  `structuredOperations`, `toolCrudLoop`, `hybrid`) and their schemas.

**Add (neutral proof):**

- **One tiny neutral sample eval** (e.g. extract structured JSON from a free-text
  prompt, or classify sentiment) with 2–3 fixtures, proving the harness runs
  deterministic + judge checks and emits a report. No task-list domain.
- `evals/README.md` — generic usage.
- `npm run evals` / `evals:smoke` scripts in the template `package.json`.

**Reference layer for evals:**

- `docs/decisions/` — one reworked ADR: **evals-at-repo-root** (generic).
- `docs/learnings/` — 1–2 reworked learnings:
  `model-eval-fixture-robustness`, eval judge-gate discipline
  (`check-eval-judge-gates`), stripped of task-list examples.
- `docs/guides/evals.md` — short "how this template does evals" page.

---

## 7. Validation

Work is complete only when all pass:

- `vitest run` green in the template.
- `npm run evals:smoke` runs the neutral sample eval and emits a report.
- `node scripts/check-no-product-leak.mjs` exits 0 across the tracked tree.
- Typecheck green for the new `evals/` sources.
- `.agents/learnings/` is gone; its notes live under `docs/learnings/` with an
  index; nothing references the old path.

---

## 8. Deliverables checklist

- [ ] `.agents/skills/backport-lessons/SKILL.md`
- [ ] `scripts/check-no-product-leak.mjs` (+ `.test.mjs`), wired into verify
- [ ] `docs/learnings/` populated (migrated 6 + evals learnings) with `README.md`
- [ ] `.agents/learnings/` retired
- [ ] `docs/decisions/` with the generic evals-at-repo-root ADR + `README.md`
- [ ] `docs/guides/evals.md`
- [ ] `evals/` generic harness + neutral sample eval + `README.md`
- [ ] `package.json` eval scripts
- [ ] A dispositions table (in the plan or a doc) recording Copy/Rework/Drop calls
- [ ] All §7 validation passing

## Future passes (out of scope, noted for continuity)

Run the same backport loop on: **voice**, **auth/sign-in**, **payments**,
**ad attribution**, plus the remaining generic ADRs and workflow skills.
