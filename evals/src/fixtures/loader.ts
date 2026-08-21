import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { EvalCase } from "../types";

const dataDir = join(dirname(fileURLToPath(import.meta.url)), "data");

export function loadCases(ids?: string[]): EvalCase[] {
  const all = readdirSync(dataDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dataDir, f), "utf8")) as EvalCase);

  if (!ids) return all;
  return ids.map((id) => {
    const found = all.find((c) => c.id === id);
    if (!found) throw new Error(`unknown fixture: ${id}`);
    return found;
  });
}
