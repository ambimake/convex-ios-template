import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Tokens that mean "a specific source app's product domain or tracker leaked
// into the generic template surface".
export const DENYLIST = [/YapTask/i, /List Memory/, /List Instruction/, /AMB-\d+/];

// Prefixes that legitimately name the source app and are not part of the
// generic template surface: the reference checkouts, branch-local/historical
// plans, and the backport specs that document what we extracted FROM.
const IGNORED_PREFIXES = [
  "yaptask/",
  "tmplt/",
  "dotdot/",
  "node_modules/",
  "docs/plans/",
  "docs/superpowers/",
];

// Individual files that must name source-app tokens to do their job: the gate
// itself, the readiness guard that blocks the source Xcode project, config that
// references the reference-checkout dirs, and the backport process doc.
const IGNORED_EXACT = new Set([
  "scripts/check-no-product-leak.mjs",
  "scripts/check-no-product-leak.test.mjs",
  "scripts/verify-template-readiness.mjs",
  "scripts/verify-template-readiness.test.mjs",
  ".gitignore",
  "vitest.config.ts",
  ".agents/skills/backport-lessons/SKILL.md",
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
