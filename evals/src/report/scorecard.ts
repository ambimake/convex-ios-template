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
