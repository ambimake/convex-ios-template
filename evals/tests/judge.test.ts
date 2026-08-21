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
