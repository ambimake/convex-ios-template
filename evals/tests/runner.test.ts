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
