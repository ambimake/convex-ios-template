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
