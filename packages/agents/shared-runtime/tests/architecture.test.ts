import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const agentRoot = join(process.cwd(), "packages", "agents");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") ? [path] : [];
  });
}

describe("human action architecture", () => {
  it("keeps outbox and final workflow writes outside agent modules", () => {
    const violations = sourceFiles(agentRoot)
      .filter((path) => path.includes(`${join("src", "")}`))
      .flatMap((path) => {
        const source = readFileSync(path, "utf8");
        const reasons = [
          source.match(/\.from\(["']outbox["']\)/u) ? "writes outbox" : null,
          source.match(/\.update\(\{[\s\S]{0,200}status:\s*["'](?:sent|routed|approved)["']/u)
            ? "sets a final side-effect status"
            : null,
        ].filter(Boolean);
        return reasons.map((reason) => `${path}: ${reason}`);
      });
    expect(violations).toEqual([]);
  });

  it("keeps the server-only review executor in the web application", () => {
    const executor = readFileSync(join(process.cwd(), "apps/web/lib/review-actions.ts"), "utf8");
    expect(executor).toContain('.from("outbox")');
    expect(executor).toContain("ReviewAccessError");
  });
});
