import { describe, it, expect } from "vitest";
import { loadCases } from "../src/fixtures/loader";

describe("loadCases", () => {
  it("loads all fixtures from the data dir", () => {
    const cases = loadCases();
    expect(cases.length).toBeGreaterThanOrEqual(2);
    expect(cases.every((c) => c.id && c.prompt && Array.isArray(c.checks))).toBe(true);
  });

  it("filters by id when given a list", () => {
    const cases = loadCases(["extract-contact"]);
    expect(cases).toHaveLength(1);
    expect(cases[0].id).toBe("extract-contact");
  });

  it("throws on unknown id", () => {
    expect(() => loadCases(["nope"])).toThrow(/unknown fixture/i);
  });
});
