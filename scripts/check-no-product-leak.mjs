import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Tokens that mean "a specific source app leaked into the generic template".
export const DENYLIST = [/YapTask/i, /List Memory/, /List Instruction/, /AMB-\d+/];

// Paths that legitimately name the source app: reference checkouts and the
// backport spec/plan that document what we extracted FROM.
const IGNORED_PREFIXES = ["yaptask/", "tmplt/", "dotdot/", "node_modules/"];
const IGNORED_EXACT = new Set([
  "docs/superpowers/specs/2026-07-02-template-backport-framework-design.md",
  "docs/plans/template-backport-framework-evals.md",
]);

export function findLeaks({ files }) {
  const leaks = [];
  for (const file of files) {
    if (IGNORED_PREFIXES.some((p) => file.path.startsWith(p))) continue;
    if (IGNORED_EXACT.has(file.path)) continue;
    for (const re of DENYLIST) {
      const match = file.content.match(re);
      if (match) leaks.push({ path: file.path, token: match[0] });
    }
  }
  return leaks;
}

function trackedFiles() {
  const out = execFileSync("git", ["ls-files"], { encoding: "utf8" });
  return out
    .split("\n")
    .filter(Boolean)
    .map((path) => {
      try {
        return { path, content: readFileSync(path, "utf8") };
      } catch {
        return { path, content: "" };
      }
    });
}

// Only run the scan when executed directly, not when imported by the test.
const invokedDirectly =
  process.argv[1] && process.argv[1].endsWith("check-no-product-leak.mjs");
if (invokedDirectly) {
  const leaks = findLeaks({ files: trackedFiles() });
  if (leaks.length) {
    for (const l of leaks) {
      console.error(`product-leak: ${l.path} contains "${l.token}"`);
    }
    console.error(`\n${leaks.length} product-token leak(s) found.`);
    process.exit(1);
  }
  console.log("no-product-leak: clean");
}
