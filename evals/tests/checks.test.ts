import { describe, it, expect } from "vitest";
import { runDeterministicChecks } from "../src/checks/deterministic";

describe("runDeterministicChecks", () => {
  it("passes a contains check", () => {
    const r = runDeterministicChecks("hello world", [{ type: "contains", value: "world" }]);
    expect(r[0].passed).toBe(true);
  });

  it("fails a regex check that does not match", () => {
    const r = runDeterministicChecks("negative", [{ type: "regex", pattern: "^positive$" }]);
    expect(r[0].passed).toBe(false);
  });

  it("evaluates a jsonPath check against parsed JSON output", () => {
    const r = runDeterministicChecks('{"name":"Dana Lee"}', [
      { type: "jsonPath", path: "name", equals: "Dana Lee" },
    ]);
    expect(r[0].passed).toBe(true);
  });

  it("fails jsonPath gracefully on non-JSON output", () => {
    const r = runDeterministicChecks("not json", [{ type: "jsonPath", path: "name", equals: "x" }]);
    expect(r[0].passed).toBe(false);
    expect(r[0].detail).toMatch(/parse|json/i);
  });
});
