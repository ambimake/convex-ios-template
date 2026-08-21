// Canned model + judge responses keyed by prompt substring so `evals:smoke`
// exercises the whole pipeline to a PASS scorecard with no network.
export const smokeModelResponses: Record<string, string> = {
  "extract the contact": '{"name":"Dana Lee","email":"dana.lee@example.com"}',
  "classify the sentiment": "positive",
};

export const smokeJudgeResponses: Record<string, string> = {
  rubric: "SCORE: 5\nRATIONALE: matches the rubric",
};
