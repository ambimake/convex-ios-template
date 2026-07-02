import type { Provider } from "../types";

// Real provider used only in `full` mode when ANTHROPIC_API_KEY is set.
// Uses fetch against the Messages API so the template needs no SDK dependency.
// Model id and request shape per the claude-api reference (Opus 4.8 default).
export class AnthropicProvider implements Provider {
  name = "anthropic";
  constructor(
    private readonly apiKey: string,
    private readonly model = "claude-opus-4-8",
  ) {}

  async complete({ prompt }: { prompt: string }): Promise<{ text: string }> {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      content: { type: string; text?: string }[];
    };
    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    return { text };
  }
}
