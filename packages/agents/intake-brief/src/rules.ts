import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export async function readIntakeRules() {
  const candidates = [
    resolve(process.cwd(), "docs/firm/intake-rules.md"),
    resolve(process.cwd(), "../../docs/firm/intake-rules.md"),
  ];
  for (const path of candidates) {
    try {
      const rules = await readFile(path, "utf8");
      if (!rules.trim()) throw new Error("The intake rules document is empty.");
      return rules;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  throw new Error("docs/firm/intake-rules.md could not be found from the server workspace.");
}
