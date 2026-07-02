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
