import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("release harness", () => {
  it("passes deterministic eval, pressure and red-team gates", () => {
    const output = execFileSync(process.execPath, ["packages/evals/src/run.mjs", "release"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(output).toContain("PASS Intake Brief: 60 cases");
    expect(output).toContain("PASS Accounting and Logistics: 18 cases");
    expect(output).toContain("PASS Red-team suite: 40 cases");
  });
});
