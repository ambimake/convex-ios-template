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
          return {
            passed: false,
            detail: `jsonPath parse error: ${(e as Error).message}`,
          };
        }
      }
    }
  });
}
