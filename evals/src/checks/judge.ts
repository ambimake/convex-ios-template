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
  const { text } = await judge.complete({
    prompt: buildJudgePrompt(input.output, input.rubric),
  });
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
  const score = scoreMatch ? Number(scoreMatch[1]) : 0;
  const rationale = (text.match(/RATIONALE:\s*(.+)/i)?.[1] ?? "").trim();
  return { score, passed: score >= input.minScore, rationale };
}
