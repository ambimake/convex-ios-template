import type { Provider } from "../types";

// Deterministic, offline provider. Maps a lowercased prompt-substring to a
// canned response so smoke runs and unit tests need no network or API key.
export class MockProvider implements Provider {
  name = "mock";
  constructor(private readonly responses: Record<string, string>) {}

  async complete({ prompt }: { prompt: string }): Promise<{ text: string }> {
    const lower = prompt.toLowerCase();
    for (const [key, value] of Object.entries(this.responses)) {
      if (lower.includes(key.toLowerCase())) return { text: value };
    }
    return { text: "[mock:no-match]" };
  }
}
