# Template Backport Framework + Evals Proof Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the reusable machine for turning source-app lessons into generic
template assets (selection rubric + `backport-lessons` skill + no-product-leak
gate), and prove it end-to-end by extracting a generic LLM eval harness.

**Architecture:** Three framework artifacts (skill doc, leak-gate script,
consolidated learnings home) plus one proof vertical: a lean, provider-pluggable
eval harness under `evals/` that runs offline via a deterministic mock provider
and optionally against a real Claude provider. TDD throughout; the harness is
built bottom-up (types → loader → checks → provider → judge → runner → report →
cli).

**Tech Stack:** Node ESM, TypeScript, Vitest, `tsx` for the CLI, Convex repo
conventions. No network in tests (mock provider). Real provider uses the
Anthropic Messages API via `fetch` (no SDK dependency).

Spec: `docs/superpowers/specs/2026-07-02-template-backport-framework-design.md`

---

## Goal / Non-Goals

**Goal:** A repeatable backport process and a working generic eval harness, with
nothing YapTask-specific leaking into the template.

**Non-Goals:**
- Voice / auth / payments / attribution verticals (future passes).
- Porting yaptask's task-list strategy machinery (diffWholeList, toolCrudLoop,
  structuredOperations, hybrid) — product-specific, dropped.
- The remaining ~6 generic ADRs beyond evals-at-repo-root (short follow-up batch).
- The encrypted hidden-fixtures pattern (optional follow-up; note in guide).
- Any iOS target or Convex schema change.

## Ship Now / Defer

**Ship now:** rubric + `backport-lessons` skill; `check-no-product-leak.mjs`
wired into verify; learnings consolidated under `docs/learnings/`; generic
`evals/` harness with a neutral sample eval that runs under `evals:smoke`
offline; evals ADR + guide + 1–2 reworked learnings; all validation green.

**Defer:** real-provider CI runs (needs a key), additional verticals, remaining
ADRs, hidden-fixtures encryption, trend/compare report modes beyond scorecard.

## Engineering Posture

- Outside-in: each harness unit is a pure function with a Vitest test as the
  entry point. The mock provider keeps everything deterministic and offline.
- Invalid-state prevention: fixtures validated on load; unknown check types throw.
- Frequent commits: one commit per task.
- Consult the `claude-api` skill before implementing the real Anthropic provider
  (Task 11) for the correct model id, endpoint, headers, and request shape.

## Learnings Applied

Checked the template's `.agents/learnings/README.md`. Relevant:
- `convex-action-payload-limits` / `convex-action-vendor-reporting` — not
  directly triggered (no new Convex actions here).
- None of the existing 6 learnings block this work; they are migrated in Task 3.

---

## Delivery Map

| Node | Mode/Skill | Owner | Depends on | Gate | Evidence |
|---|---|---|---|---|---|
| N1 Leak gate | execute (TDD) | inline | — | vitest | `check-no-product-leak.test.mjs` green |
| N2 Backport skill | execute | inline | — | self-review | `SKILL.md` present |
| N3 Learnings home | execute | inline | — | grep clean | no live `.agents/learnings` refs |
| N4 Evals scaffold | execute | inline | — | typecheck | `evals/tsconfig.json`, `types.ts` |
| N5 Fixture loader | execute (TDD) | inline | N4 | vitest | loader test green |
| N6 Deterministic checks | execute (TDD) | inline | N4 | vitest | checks test green |
| N7 Providers (iface+mock) | execute (TDD) | inline | N4 | vitest | mock test green |
| N8 Judge check | execute (TDD) | inline | N7 | vitest | judge test green |
| N9 Runner | execute (TDD) | inline | N5–N8 | vitest | runner test green |
| N10 Scorecard/report | execute (TDD) | inline | N9 | vitest | scorecard test green |
| N11 CLI + real provider | execute | inline | N9,N10 | smoke runs | `evals:smoke` emits report |
| N12 Wiring + README | execute | inline | N1,N11 | verify | `npm run verify` green |
| N13 ADR + guide + learnings | execute | inline | N11 | leak gate | files present, gate clean |
| N14 Full validation | verification | inline | all | all §7 | all commands green |
| N15 Compound + ship | compound-learning/ship | inline | N14 | PR | branch pushed, PR opened |

---

## Phase A — Framework

### Task 1: No-product-leak gate

**Files:**
- Create: `scripts/check-no-product-leak.mjs`
- Test: `scripts/check-no-product-leak.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
// scripts/check-no-product-leak.test.mjs
import { describe, it, expect } from "vitest";
import { findLeaks, DENYLIST } from "./check-no-product-leak.mjs";

describe("findLeaks", () => {
  it("flags product tokens in tracked files", () => {
    const files = [{ path: "convex/x.ts", content: "handle YapTask commands" }];
    const leaks = findLeaks({ files });
    expect(leaks).toHaveLength(1);
    expect(leaks[0]).toMatchObject({ path: "convex/x.ts", token: "YapTask" });
  });

  it("ignores reference checkout dirs", () => {
    const files = [{ path: "yaptask/convex/x.ts", content: "YapTask" }];
    expect(findLeaks({ files })).toHaveLength(0);
  });

  it("ignores the spec and this plan that name the source app", () => {
    const files = [
      { path: "docs/superpowers/specs/2026-07-02-template-backport-framework-design.md", content: "YapTask" },
      { path: "docs/plans/template-backport-framework-evals.md", content: "YapTask" },
    ];
    expect(findLeaks({ files })).toHaveLength(0);
  });

  it("flags Linear issue keys", () => {
    const files = [{ path: "docs/x.md", content: "see AMB-123" }];
    expect(findLeaks({ files })[0]).toMatchObject({ token: "AMB-123" });
  });

  it("passes clean files", () => {
    expect(findLeaks({ files: [{ path: "convex/x.ts", content: "generic voice agent" }] })).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/check-no-product-leak.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the script**

```js
// scripts/check-no-product-leak.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Tokens that mean "a specific source app leaked into the generic template".
export const DENYLIST = [
  /YapTask/i,
  /List Memory/,
  /List Instruction/,
  /AMB-\d+/,
];

// Paths that legitimately name the source app: reference checkouts and the
// backport spec/plan that document what we extracted FROM.
const IGNORED_PREFIXES = ["yaptask/", "tmplt/", "dotdot/", "node_modules/"];
const IGNORED_EXACT = new Set([
  "docs/superpowers/specs/2026-07-02-template-backport-framework-design.md",
  "docs/plans/template-backport-framework-evals.md",
]);

function tokenLabel(re) {
  const m = re.source.match(/[A-Za-z]+-\\d\+/) ? "AMB-123" : null;
  return m ?? re.source.replace(/\\.*$/, "").replace(/[()\\]/g, "");
}

export function findLeaks({ files }) {
  const leaks = [];
  for (const file of files) {
    if (IGNORED_PREFIXES.some((p) => file.path.startsWith(p))) continue;
    if (IGNORED_EXACT.has(file.path)) continue;
    for (const re of DENYLIST) {
      const match = file.content.match(re);
      if (match) leaks.push({ path: file.path, token: match[0] });
    }
  }
  return leaks;
}

function trackedFiles() {
  const out = execFileSync("git", ["ls-files"], { encoding: "utf8" });
  return out
    .split("\n")
    .filter(Boolean)
    .map((path) => {
      try {
        return { path, content: readFileSync(path, "utf8") };
      } catch {
        return { path, content: "" };
      }
    });
}

// Only run the scan when executed directly, not when imported by the test.
const invokedDirectly = process.argv[1] && process.argv[1].endsWith("check-no-product-leak.mjs");
if (invokedDirectly) {
  const leaks = findLeaks({ files: trackedFiles() });
  if (leaks.length) {
    for (const l of leaks) console.error(`product-leak: ${l.path} contains "${l.token}"`);
    console.error(`\n${leaks.length} product-token leak(s) found.`);
    process.exit(1);
  }
  console.log("no-product-leak: clean");
}
```

Note: the `token` returned is the actual matched substring (`match[0]`), so the
`toMatchObject({ token: "YapTask" })` and `{ token: "AMB-123" }` assertions hold
without the `tokenLabel` helper being on the hot path. Remove `tokenLabel` if
unused after Step 4.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/check-no-product-leak.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/check-no-product-leak.mjs scripts/check-no-product-leak.test.mjs
git commit -m "Add no-product-leak gate for template backports"
```

### Task 2: `backport-lessons` skill

**Files:**
- Create: `.agents/skills/backport-lessons/SKILL.md`

- [ ] **Step 1: Write the skill**

```markdown
---
name: backport-lessons
description: Use when pulling reusable lessons, skills, ADRs, or code from a source app checkout into this generic Convex+iOS template without leaking product specifics.
---

# Backport Lessons

Turn a source app's hard-won lessons into generic template assets. The template
is a clone-and-go foundation plus a reference layer; nothing product-specific
survives unless reworked into a product-agnostic form.

## Inputs

- A source-app checkout beside the template (e.g. `yaptask/`, `tmplt/`, `dotdot/`).
- The template's `docs/learnings/`, `docs/decisions/`, `.agents/skills/`.

## Selection rubric

Admit a candidate (learning, ADR, skill, code) only if it passes ALL four:

1. Product-agnostic — no source-app domain nouns. If stripping product context
   guts the lesson, drop it.
2. Recurring — you'd hit it again on the next Convex+iOS app.
3. Non-obvious / costly to relearn — a real mistake or a decision worth recording.
4. Stable — not tied to a churny internal choice.

## Disposition

Assign each candidate one of:
- Copy (rare) — already generic; take nearly verbatim.
- Rework (default) — strip specifics, swap in a neutral example.
- Drop — product-only or obvious.

Record the calls in a dispositions table (source path → disposition → rationale).

## Process

1. Enumerate candidates from the source checkout (recent commits + its skills /
   learnings / ADRs / scripts).
2. Score each against the rubric; write the dispositions table.
3. Rework accepted candidates into generic form.
4. Land in the right home and register:
   - learnings → `docs/learnings/` + index in `docs/learnings/README.md`
   - ADRs → `docs/decisions/` + index in `docs/decisions/README.md`
   - skills → `.agents/skills/<name>/SKILL.md` (+ `skills-lock.json` if sourced)
   - code → its natural dir, with a `docs/guides/<capability>.md` page
5. Verify: `npm run verify` green AND `node scripts/check-no-product-leak.mjs`
   clean. Extend the leak denylist when a new source app is introduced.
```

- [ ] **Step 2: Commit**

```bash
git add .agents/skills/backport-lessons/SKILL.md
git commit -m "Add backport-lessons skill"
```

### Task 3: Consolidate learnings into `docs/learnings/`

**Files:**
- Move: `.agents/learnings/*.md` → `docs/learnings/*.md` (git mv, 6 files incl. README)
- Modify refs: `README.md:113`, `AGENTS.md:9`, `docs/README.md:28`,
  `.agents/skills/ios-voice-template/SKILL.md:12-13`,
  `.agents/skills/plan-work/SKILL.md:19`,
  `.agents/skills/convex-voice-agent/SKILL.md:12-13`

- [ ] **Step 1: Move the files with git mv**

```bash
mkdir -p docs/learnings
git mv .agents/learnings/README.md docs/learnings/README.md
git mv .agents/learnings/convex-action-payload-limits.md docs/learnings/convex-action-payload-limits.md
git mv .agents/learnings/convex-action-vendor-reporting.md docs/learnings/convex-action-vendor-reporting.md
git mv .agents/learnings/deployment-secrets.md docs/learnings/deployment-secrets.md
git mv .agents/learnings/ios-accessibility-identifiers.md docs/learnings/ios-accessibility-identifiers.md
git mv .agents/learnings/ios-simulator-verification.md docs/learnings/ios-simulator-verification.md
```

- [ ] **Step 2: Update every live reference**

Replace `.agents/learnings/` → `docs/learnings/` and `agents/learnings` →
`docs/learnings` in these tracked files (NOT under `yaptask/ tmplt/ dotdot/`):
`README.md`, `AGENTS.md`, `docs/README.md`,
`.agents/skills/ios-voice-template/SKILL.md`,
`.agents/skills/plan-work/SKILL.md`,
`.agents/skills/convex-voice-agent/SKILL.md`, and the historical plans that
mention it (`docs/plans/resumable-account-deletion.md`,
`docs/plans/av-audio-transcription-wiring.md`,
`docs/plans/template-hardening-v2.md`).

- [ ] **Step 3: Verify no live references remain**

Run:
```bash
grep -rn "\.agents/learnings\|agents/learnings" . \
  --exclude-dir=node_modules --exclude-dir=.git \
  | grep -v "yaptask/\|tmplt/\|dotdot/"
```
Expected: no output.

- [ ] **Step 4: Update `verify-template-readiness` scanned paths if needed**

`scripts/verify-template-readiness.mjs` scans `docs` already, so no change is
required for readiness. Confirm by running:
```bash
npm run verify:template
```
Expected: exits 0.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Consolidate learnings into docs/learnings"
```

---

## Phase B — Evals proof vertical

### Task 4: Evals scaffold (tsconfig + shared types)

**Files:**
- Create: `evals/tsconfig.json`
- Create: `evals/src/types.ts`

- [ ] **Step 1: Create `evals/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "allowJs": true,
    "noEmit": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

- [ ] **Step 2: Create `evals/src/types.ts`**

```ts
// A single eval case loaded from a fixture file.
export interface EvalCase {
  id: string;
  prompt: string;
  // Deterministic assertions applied to the model output.
  checks: DeterministicCheck[];
  // Optional rubric for an LLM-as-judge pass.
  judge?: { rubric: string; minScore: number };
}

export type DeterministicCheck =
  | { type: "contains"; value: string }
  | { type: "regex"; pattern: string }
  | { type: "jsonPath"; path: string; equals: unknown };

export interface CheckResult {
  passed: boolean;
  detail: string;
}

export interface JudgeResult {
  score: number;
  passed: boolean;
  rationale: string;
}

export interface CaseResult {
  id: string;
  output: string;
  deterministic: CheckResult[];
  judge?: JudgeResult;
  passed: boolean;
}

export interface Provider {
  name: string;
  complete(input: { prompt: string }): Promise<{ text: string }>;
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc -p evals/tsconfig.json`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add evals/tsconfig.json evals/src/types.ts
git commit -m "Scaffold generic evals harness types"
```

### Task 5: Fixture loader + neutral sample eval

**Files:**
- Create: `evals/src/fixtures/loader.ts`
- Create: `evals/src/fixtures/data/extract-contact.json`
- Create: `evals/src/fixtures/data/classify-sentiment.json`
- Test: `evals/tests/loader.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// evals/tests/loader.test.ts
import { describe, it, expect } from "vitest";
import { loadCases } from "../src/fixtures/loader";

describe("loadCases", () => {
  it("loads all fixtures from the data dir", () => {
    const cases = loadCases();
    expect(cases.length).toBeGreaterThanOrEqual(2);
    expect(cases.every((c) => c.id && c.prompt && Array.isArray(c.checks))).toBe(true);
  });

  it("filters by id when given a list", () => {
    const cases = loadCases(["extract-contact"]);
    expect(cases).toHaveLength(1);
    expect(cases[0].id).toBe("extract-contact");
  });

  it("throws on unknown id", () => {
    expect(() => loadCases(["nope"])).toThrow(/unknown fixture/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run evals/tests/loader.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Create the two neutral fixtures**

```json
// evals/src/fixtures/data/extract-contact.json
{
  "id": "extract-contact",
  "prompt": "Extract the contact as JSON {name,email} from: Reach Dana Lee at dana.lee@example.com.",
  "checks": [
    { "type": "jsonPath", "path": "name", "equals": "Dana Lee" },
    { "type": "jsonPath", "path": "email", "equals": "dana.lee@example.com" }
  ],
  "judge": { "rubric": "Output is valid JSON with the correct name and email.", "minScore": 4 }
}
```

```json
// evals/src/fixtures/data/classify-sentiment.json
{
  "id": "classify-sentiment",
  "prompt": "Classify the sentiment as exactly one word (positive/negative/neutral): I absolutely loved it.",
  "checks": [{ "type": "regex", "pattern": "^\\s*positive\\s*$" }],
  "judge": { "rubric": "Output is the single word 'positive'.", "minScore": 4 }
}
```

- [ ] **Step 4: Write the loader**

```ts
// evals/src/fixtures/loader.ts
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { EvalCase } from "../types";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "data");

export function loadCases(ids?: string[]): EvalCase[] {
  const all = readdirSync(dataDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dataDir, f), "utf8")) as EvalCase);

  if (!ids) return all;
  return ids.map((id) => {
    const found = all.find((c) => c.id === id);
    if (!found) throw new Error(`unknown fixture: ${id}`);
    return found;
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run evals/tests/loader.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add evals/src/fixtures evals/tests/loader.test.ts
git commit -m "Add evals fixture loader and neutral sample cases"
```

### Task 6: Deterministic checks

**Files:**
- Create: `evals/src/checks/deterministic.ts`
- Test: `evals/tests/checks.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// evals/tests/checks.test.ts
import { describe, it, expect } from "vitest";
import { runDeterministicChecks } from "../src/checks/deterministic";

describe("runDeterministicChecks", () => {
  it("passes a contains check", () => {
    const r = runDeterministicChecks("hello world", [{ type: "contains", value: "world" }]);
    expect(r[0].passed).toBe(true);
  });

  it("fails a regex check that does not match", () => {
    const r = runDeterministicChecks("negative", [{ type: "regex", pattern: "^positive$" }]);
    expect(r[0].passed).toBe(false);
  });

  it("evaluates a jsonPath check against parsed JSON output", () => {
    const r = runDeterministicChecks('{"name":"Dana Lee"}', [
      { type: "jsonPath", path: "name", equals: "Dana Lee" },
    ]);
    expect(r[0].passed).toBe(true);
  });

  it("fails jsonPath gracefully on non-JSON output", () => {
    const r = runDeterministicChecks("not json", [{ type: "jsonPath", path: "name", equals: "x" }]);
    expect(r[0].passed).toBe(false);
    expect(r[0].detail).toMatch(/parse/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run evals/tests/checks.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the checks**

```ts
// evals/src/checks/deterministic.ts
import type { CheckResult, DeterministicCheck } from "../types";

function extractJson(output: string): unknown {
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON object found");
  return JSON.parse(output.slice(start, end + 1));
}

export function runDeterministicChecks(
  output: string,
  checks: DeterministicCheck[],
): CheckResult[] {
  return checks.map((check): CheckResult => {
    switch (check.type) {
      case "contains":
        return {
          passed: output.includes(check.value),
          detail: `contains "${check.value}"`,
        };
      case "regex":
        return {
          passed: new RegExp(check.pattern).test(output),
          detail: `regex /${check.pattern}/`,
        };
      case "jsonPath": {
        try {
          const parsed = extractJson(output) as Record<string, unknown>;
          const actual = parsed[check.path];
          return {
            passed: actual === check.equals,
            detail: `jsonPath ${check.path} = ${JSON.stringify(actual)}`,
          };
        } catch (e) {
          return { passed: false, detail: `jsonPath parse error: ${(e as Error).message}` };
        }
      }
    }
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run evals/tests/checks.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add evals/src/checks/deterministic.ts evals/tests/checks.test.ts
git commit -m "Add deterministic eval checks"
```

### Task 7: Provider interface + mock provider

**Files:**
- Create: `evals/src/providers/mock.ts`
- Test: `evals/tests/mock.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// evals/tests/mock.test.ts
import { describe, it, expect } from "vitest";
import { MockProvider } from "../src/providers/mock";

describe("MockProvider", () => {
  it("returns scripted output keyed by prompt substring", async () => {
    const p = new MockProvider({ "extract the contact": '{"name":"Dana Lee","email":"dana.lee@example.com"}' });
    const r = await p.complete({ prompt: "Extract the contact as JSON ..." });
    expect(r.text).toContain("Dana Lee");
  });

  it("returns a default marker when nothing matches", async () => {
    const p = new MockProvider({});
    const r = await p.complete({ prompt: "anything" });
    expect(r.text).toBe("[mock:no-match]");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run evals/tests/mock.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the mock provider**

```ts
// evals/src/providers/mock.ts
import type { Provider } from "../types";

// Deterministic, offline provider. Maps a lowercased prompt-substring to a
// canned response so smoke runs and unit tests need no network or API key.
export class MockProvider implements Provider {
  name = "mock";
  constructor(private readonly responses: Record<string, string>) {}

  async complete({ prompt }: { prompt: string }): Promise<{ text: string }> {
    const lower = prompt.toLowerCase();
    for (const [key, value] of Object.entries(this.responses)) {
      if (lower.includes(key.toLowerCase())) return { text: value };
    }
    return { text: "[mock:no-match]" };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run evals/tests/mock.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add evals/src/providers/mock.ts evals/tests/mock.test.ts
git commit -m "Add mock eval provider"
```

### Task 8: LLM-as-judge check

**Files:**
- Create: `evals/src/checks/judge.ts`
- Test: `evals/tests/judge.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// evals/tests/judge.test.ts
import { describe, it, expect } from "vitest";
import { runJudge } from "../src/checks/judge";
import { MockProvider } from "../src/providers/mock";

describe("runJudge", () => {
  it("parses a numeric score from the judge provider and applies minScore", async () => {
    const judge = new MockProvider({ rubric: "SCORE: 5\nRATIONALE: correct" });
    const r = await runJudge(judge, { output: "x", rubric: "any rubric text", minScore: 4 });
    expect(r.score).toBe(5);
    expect(r.passed).toBe(true);
  });

  it("fails when the score is below minScore", async () => {
    const judge = new MockProvider({ rubric: "SCORE: 2\nRATIONALE: wrong" });
    const r = await runJudge(judge, { output: "x", rubric: "any rubric text", minScore: 4 });
    expect(r.passed).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run evals/tests/judge.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the judge**

```ts
// evals/src/checks/judge.ts
import type { JudgeResult, Provider } from "../types";

export function buildJudgePrompt(output: string, rubric: string): string {
  return [
    "You are grading a model output against a rubric.",
    `Rubric: ${rubric}`,
    `Output: ${output}`,
    "Reply with two lines exactly:",
    "SCORE: <integer 1-5>",
    "RATIONALE: <one sentence>",
  ].join("\n");
}

export async function runJudge(
  judge: Provider,
  input: { output: string; rubric: string; minScore: number },
): Promise<JudgeResult> {
  const { text } = await judge.complete({ prompt: buildJudgePrompt(input.output, input.rubric) });
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
  const score = scoreMatch ? Number(scoreMatch[1]) : 0;
  const rationale = (text.match(/RATIONALE:\s*(.+)/i)?.[1] ?? "").trim();
  return { score, passed: score >= input.minScore, rationale };
}
```

Note: the mock judge test keys on the substring `"rubric"`, which appears in the
judge prompt (`Rubric: ...`), so the canned response is returned.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run evals/tests/judge.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add evals/src/checks/judge.ts evals/tests/judge.test.ts
git commit -m "Add LLM-as-judge eval check"
```

### Task 9: Runner

**Files:**
- Create: `evals/src/runner.ts`
- Test: `evals/tests/runner.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// evals/tests/runner.test.ts
import { describe, it, expect } from "vitest";
import { runCases } from "../src/runner";
import { MockProvider } from "../src/providers/mock";
import type { EvalCase } from "../src/types";

const cases: EvalCase[] = [
  {
    id: "c1",
    prompt: "say positive",
    checks: [{ type: "regex", pattern: "^positive$" }],
    judge: { rubric: "is positive", minScore: 4 },
  },
];

describe("runCases", () => {
  it("runs deterministic checks against the model provider output", async () => {
    const model = new MockProvider({ "say positive": "positive" });
    const results = await runCases(cases, { model });
    expect(results[0].passed).toBe(true);
    expect(results[0].deterministic[0].passed).toBe(true);
  });

  it("includes a judge result only when a judge provider is supplied", async () => {
    const model = new MockProvider({ "say positive": "positive" });
    const judge = new MockProvider({ "is positive": "SCORE: 5\nRATIONALE: ok" });
    const withJudge = await runCases(cases, { model, judge });
    expect(withJudge[0].judge?.score).toBe(5);
    const noJudge = await runCases(cases, { model });
    expect(noJudge[0].judge).toBeUndefined();
  });

  it("marks a case failed when a deterministic check fails", async () => {
    const model = new MockProvider({ "say positive": "negative" });
    const results = await runCases(cases, { model });
    expect(results[0].passed).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run evals/tests/runner.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the runner**

```ts
// evals/src/runner.ts
import { runDeterministicChecks } from "./checks/deterministic";
import { runJudge } from "./checks/judge";
import type { CaseResult, EvalCase, Provider } from "./types";

export async function runCases(
  cases: EvalCase[],
  providers: { model: Provider; judge?: Provider },
): Promise<CaseResult[]> {
  const results: CaseResult[] = [];
  for (const c of cases) {
    const { text: output } = await providers.model.complete({ prompt: c.prompt });
    const deterministic = runDeterministicChecks(output, c.checks);
    let judge: CaseResult["judge"];
    if (c.judge && providers.judge) {
      judge = await runJudge(providers.judge, {
        output,
        rubric: c.judge.rubric,
        minScore: c.judge.minScore,
      });
    }
    const passed =
      deterministic.every((d) => d.passed) && (judge ? judge.passed : true);
    results.push({ id: c.id, output, deterministic, judge, passed });
  }
  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run evals/tests/runner.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add evals/src/runner.ts evals/tests/runner.test.ts
git commit -m "Add eval runner"
```

### Task 10: Scorecard/report

**Files:**
- Create: `evals/src/report/scorecard.ts`
- Test: `evals/tests/scorecard.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// evals/tests/scorecard.test.ts
import { describe, it, expect } from "vitest";
import { buildScorecard, renderMarkdown } from "../src/report/scorecard";
import type { CaseResult } from "../src/types";

const results: CaseResult[] = [
  { id: "a", output: "x", deterministic: [{ passed: true, detail: "" }], passed: true },
  { id: "b", output: "y", deterministic: [{ passed: false, detail: "" }], passed: false },
];

describe("scorecard", () => {
  it("counts passed and total", () => {
    const s = buildScorecard(results);
    expect(s).toMatchObject({ passed: 1, total: 2 });
  });

  it("renders a markdown table listing each case", () => {
    const md = renderMarkdown(buildScorecard(results));
    expect(md).toContain("1/2");
    expect(md).toContain("| a |");
    expect(md).toContain("| b |");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run evals/tests/scorecard.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the scorecard**

```ts
// evals/src/report/scorecard.ts
import type { CaseResult } from "../types";

export interface Scorecard {
  passed: number;
  total: number;
  rows: { id: string; passed: boolean }[];
}

export function buildScorecard(results: CaseResult[]): Scorecard {
  return {
    passed: results.filter((r) => r.passed).length,
    total: results.length,
    rows: results.map((r) => ({ id: r.id, passed: r.passed })),
  };
}

export function renderMarkdown(s: Scorecard): string {
  const header = `# Eval Scorecard\n\n**${s.passed}/${s.total} passed**\n\n| case | result |\n| --- | --- |`;
  const rows = s.rows.map((r) => `| ${r.id} | ${r.passed ? "PASS" : "FAIL"} |`);
  return [header, ...rows].join("\n") + "\n";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run evals/tests/scorecard.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add evals/src/report/scorecard.ts evals/tests/scorecard.test.ts
git commit -m "Add eval scorecard report"
```

### Task 11: CLI + real Anthropic provider

**Files:**
- Create: `evals/src/providers/anthropic.ts`
- Create: `evals/src/providers/smokeResponses.ts`
- Create: `evals/src/cli.ts`

- [ ] **Step 1: Consult the claude-api skill**

Invoke the `claude-api` skill and confirm the current model id, endpoint
(`https://api.anthropic.com/v1/messages`), required headers
(`x-api-key`, `anthropic-version`), and request/response shape before writing
the provider.

- [ ] **Step 2: Write the Anthropic provider (fetch-based, no SDK)**

```ts
// evals/src/providers/anthropic.ts
import type { Provider } from "../types";

// Real provider used only in `full` mode when ANTHROPIC_API_KEY is set.
// Uses fetch against the Messages API so the template needs no SDK dependency.
export class AnthropicProvider implements Provider {
  name = "anthropic";
  constructor(
    private readonly apiKey: string,
    private readonly model = "claude-opus-4-8",
  ) {}

  async complete({ prompt }: { prompt: string }): Promise<{ text: string }> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { content: { type: string; text?: string }[] };
    const text = data.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
    return { text };
  }
}
```

Confirm the model id against the claude-api skill output in Step 1 and adjust if
the skill reports a different current id.

- [ ] **Step 3: Write canned smoke responses (offline correctness)**

```ts
// evals/src/providers/smokeResponses.ts
// Canned model + judge responses keyed by prompt substring so `evals:smoke`
// exercises the whole pipeline to a PASS scorecard with no network.
export const smokeModelResponses: Record<string, string> = {
  "extract the contact": '{"name":"Dana Lee","email":"dana.lee@example.com"}',
  "classify the sentiment": "positive",
};

export const smokeJudgeResponses: Record<string, string> = {
  rubric: "SCORE: 5\nRATIONALE: matches the rubric",
};
```

- [ ] **Step 4: Write the CLI**

```ts
// evals/src/cli.ts
import { loadCases } from "./fixtures/loader";
import { runCases } from "./runner";
import { buildScorecard, renderMarkdown } from "./report/scorecard";
import { MockProvider } from "./providers/mock";
import { AnthropicProvider } from "./providers/anthropic";
import { smokeModelResponses, smokeJudgeResponses } from "./providers/smokeResponses";
import type { Provider } from "./types";

function parseArgs(argv: string[]) {
  const mode = argv.includes("--mode") ? argv[argv.indexOf("--mode") + 1] : "smoke";
  const fxIdx = argv.indexOf("--fixtures");
  const fixtures = fxIdx !== -1 ? argv[fxIdx + 1].split(",") : undefined;
  return { mode, fixtures };
}

async function main() {
  const { mode, fixtures } = parseArgs(process.argv.slice(2));
  const cases = loadCases(fixtures);

  let model: Provider;
  let judge: Provider | undefined;
  if (mode === "full") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY required for --mode full");
    model = new AnthropicProvider(key);
    judge = new AnthropicProvider(key);
  } else {
    model = new MockProvider(smokeModelResponses);
    judge = new MockProvider(smokeJudgeResponses);
  }

  const results = await runCases(cases, { model, judge });
  const scorecard = buildScorecard(results);
  process.stdout.write(renderMarkdown(scorecard));
  if (scorecard.passed < scorecard.total) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 5: Run smoke manually**

Run: `npx tsx evals/src/cli.ts --mode smoke`
Expected: markdown scorecard printing `2/2 passed`, exit 0.

- [ ] **Step 6: Commit**

```bash
git add evals/src/providers/anthropic.ts evals/src/providers/smokeResponses.ts evals/src/cli.ts
git commit -m "Add eval CLI with smoke and full modes"
```

### Task 12: Wire scripts + evals README

**Files:**
- Modify: `package.json`
- Create: `evals/README.md`

- [ ] **Step 1: Add devDependency `tsx` and scripts**

Add to `devDependencies`: `"tsx": "^4.19.2"`. Add to `scripts`:

```json
"evals": "tsx evals/src/cli.ts --mode full",
"evals:smoke": "tsx evals/src/cli.ts --mode smoke",
"typecheck:evals": "tsc -p evals/tsconfig.json",
"check:no-product-leak": "node scripts/check-no-product-leak.mjs",
"verify": "npm run typecheck:convex && npm run typecheck:evals && npm run check:no-product-leak && npm test"
```

Update `test` to include the new suites:
`"test": "vitest run convex scripts evals"`.

- [ ] **Step 2: Install**

Run: `npm install`
Expected: `tsx` added, lockfile updated.

- [ ] **Step 3: Write `evals/README.md`**

```markdown
# Evals

A generic, provider-pluggable LLM eval harness. Cases are JSON fixtures with
deterministic checks and an optional LLM-as-judge rubric.

## Commands

- `npm run evals:smoke` — runs every case through a deterministic mock provider,
  offline, no API key. Used in CI/verify.
- `npm run evals` — `--mode full`; runs against Claude. Requires
  `ANTHROPIC_API_KEY`.
- `npm run evals:smoke -- --fixtures extract-contact` — run selected cases.

## Layout

- `src/fixtures/data/*.json` — eval cases (id, prompt, checks, optional judge).
- `src/checks/` — deterministic checks + LLM-as-judge.
- `src/providers/` — provider interface, offline mock, Anthropic (fetch).
- `src/runner.ts` — runs cases through a provider and the checks.
- `src/report/scorecard.ts` — pass/total scorecard as markdown.
- `src/cli.ts` — `--mode smoke|full`, `--fixtures a,b`.

## Adding a case

Drop a JSON file in `src/fixtures/data/`. Keep prompts product-agnostic.
```

- [ ] **Step 4: Verify**

Run: `npm run verify`
Expected: typecheck (convex + evals), no-product-leak clean, all vitest suites
green.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json evals/README.md
git commit -m "Wire eval scripts and verify gate"
```

### Task 13: ADR + guide + reworked learnings

**Files:**
- Create: `docs/decisions/README.md`
- Create: `docs/decisions/0001-evals-at-repo-root.md`
- Create: `docs/guides/evals.md`
- Create: `docs/learnings/eval-fixture-robustness.md`
- Create: `docs/learnings/eval-judge-gates.md`
- Modify: `docs/learnings/README.md` (index the two new learnings)

- [ ] **Step 1: Write the ADR**

```markdown
# 0001 — Evals at repo root

Status: Accepted (template default)

## Context

AI features need repeatable, reviewable quality measurement independent of the
app runtime (SwiftUI / Convex). Burying evals inside app code couples them to
build tooling and makes them hard to run in CI.

## Decision

This template puts evals in a top-level `evals/` directory with its own
`tsconfig.json`, run via `tsx`. Cases are JSON fixtures with deterministic
checks plus an optional LLM-as-judge rubric. A deterministic mock provider makes
`evals:smoke` run offline in CI; a fetch-based Claude provider powers `--mode
full` when a key is present.

## Consequences

- Evals run without the iOS/Convex toolchain and without secrets in CI.
- Swap the provider for another model vendor by implementing the `Provider`
  interface. Swap the harness out entirely if you adopt a hosted eval platform.
```

- [ ] **Step 2: Write `docs/decisions/README.md`**

```markdown
# Decision Records

Generic, swappable template defaults. Each records a choice this template makes
and how to swap it. These are defaults to adopt or replace, not history.

- [0001 — Evals at repo root](0001-evals-at-repo-root.md)
```

- [ ] **Step 3: Write `docs/guides/evals.md`**

```markdown
# How this template does evals

Evals live in `evals/` and measure AI output quality independently of the app.

- Author cases as JSON in `evals/src/fixtures/data/` (id, prompt, deterministic
  checks, optional judge rubric).
- `npm run evals:smoke` proves the pipeline offline; `npm run evals` runs against
  Claude.
- Add a model vendor by implementing the `Provider` interface in
  `evals/src/providers/`.

Future extension: a private/encrypted fixture set for sensitive prompts (keep
them out of git) — not included in the base template.
```

- [ ] **Step 4: Write the two reworked learnings**

```markdown
# Eval Fixture Robustness

Open before writing eval fixtures or judge rubrics.

- Keep fixtures product-agnostic: a fixture that encodes one app's domain nouns
  cannot be reused and will trip the no-product-leak gate.
- Prefer a deterministic check (regex / jsonPath / contains) as the primary
  signal and use the LLM judge as a secondary rubric, not the only gate — judges
  are noisy and non-deterministic.
- Extract JSON defensively: models wrap JSON in prose. Slice from the first `{`
  to the last `}` before parsing rather than assuming the whole output is JSON.
- Make smoke runs offline. A mock provider keyed by prompt substring lets CI
  exercise the whole pipeline without a key or network flake.
```

```markdown
# Eval Judge Gates

Open before wiring evals into CI or a verify gate.

- Gate `verify` on the offline smoke run, not the real-provider run. Real
  provider calls are non-deterministic, cost money, and need a secret — keep
  them a manual/opt-in command.
- A judge score below its `minScore` should fail the case and the run's exit
  code, so a regression is a red build, not a buried log line.
- Report a scorecard (passed/total per case) so a failing case is identifiable
  at a glance in CI output.
```

- [ ] **Step 5: Index the new learnings**

Append to `docs/learnings/README.md`:

```markdown
- [Eval fixture robustness](eval-fixture-robustness.md): open before writing
  eval fixtures or judge rubrics.
- [Eval judge gates](eval-judge-gates.md): open before wiring evals into CI.
```

- [ ] **Step 6: Verify leak gate + commit**

Run: `node scripts/check-no-product-leak.mjs`
Expected: `no-product-leak: clean`.

```bash
git add docs/decisions docs/guides docs/learnings
git commit -m "Add evals ADR, guide, and reworked learnings"
```

---

## Phase C — Validation & ship

### Task 14: Full validation

- [ ] **Step 1: Run the whole verify gate**

Run: `npm run verify`
Expected: `typecheck:convex` ok, `typecheck:evals` ok, `no-product-leak: clean`,
all vitest suites (convex, scripts, evals) green.

- [ ] **Step 2: Run smoke end-to-end**

Run: `npm run evals:smoke`
Expected: `2/2 passed`, exit 0.

- [ ] **Step 3: Template readiness**

Run: `npm run verify:template`
Expected: exits 0.

- [ ] **Step 4: Confirm learnings migration is complete**

Run:
```bash
test ! -d .agents/learnings && echo "retired" || echo "STILL PRESENT"
grep -rn "\.agents/learnings" . --exclude-dir=node_modules --exclude-dir=.git | grep -v "yaptask/\|tmplt/\|dotdot/" || echo "no live refs"
```
Expected: `retired` and `no live refs`.

### Task 15: Compound learning + ship

- [ ] **Step 1: Update the dispositions record**

Ensure the spec/plan capture the Copy/Rework/Drop calls made (evals harness =
Rework; task-list strategies/fixtures/instructionSuggestions = Drop; product
ADRs = Drop). Add a short dispositions table to `docs/guides/evals.md` or a note
in the ADR if not already captured.

- [ ] **Step 2: Push and open PR**

```bash
git push -u origin ambisrc/backport-yaptask-lessons
gh pr create --base main \
  --title "Backport framework + generic evals harness" \
  --body "Adds the reusable backport machine (rubric + backport-lessons skill + no-product-leak gate), consolidates learnings under docs/learnings, and proves it by extracting a generic provider-pluggable evals harness with a neutral sample eval, ADR, guide, and reworked learnings. See docs/plans/template-backport-framework-evals.md."
```

- [ ] **Step 3: Report completion** with the PR URL and the validation evidence.

---

## Self-Review (spec coverage)

- Rubric → Task 2 (skill embeds the 4-gate rubric + dispositions). ✓
- Backport skill → Task 2. ✓
- No-product-leak gate → Task 1, wired in Task 12. ✓
- Learnings consolidation + retire `.agents/learnings` → Task 3, verified Task 14. ✓
- Generic ADR (evals-at-repo-root) → Task 13. ✓
- Evals harness (runner/checks/judge/providers/report/cli/fixtures) → Tasks 4–12. ✓
- Neutral sample eval, task-list domain dropped → Task 5. ✓
- Evals guide + reworked learnings → Task 13. ✓
- Validation (vitest, smoke, leak gate, typecheck, migration) → Task 14. ✓
- Ship → Task 15. ✓
