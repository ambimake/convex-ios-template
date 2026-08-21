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
