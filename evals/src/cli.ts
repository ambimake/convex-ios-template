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
