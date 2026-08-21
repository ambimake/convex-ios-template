import { describe, it, expect } from "vitest";
import { MockProvider } from "../src/providers/mock";

describe("MockProvider", () => {
  it("returns scripted output keyed by prompt substring", async () => {
    const p = new MockProvider({
      "extract the contact": '{"name":"Dana Lee","email":"dana.lee@example.com"}',
    });
    const r = await p.complete({ prompt: "Extract the contact as JSON ..." });
    expect(r.text).toContain("Dana Lee");
  });

  it("returns a default marker when nothing matches", async () => {
    const p = new MockProvider({});
    const r = await p.complete({ prompt: "anything" });
    expect(r.text).toBe("[mock:no-match]");
  });
});
