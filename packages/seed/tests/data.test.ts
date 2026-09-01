import { describe, expect, it } from "vitest";

import { seedData, seedIds } from "../src/data";

describe("deterministic seed", () => {
  it("creates the agreed 12-person firm", () => {
    expect(seedData.firms[0]?.name).toBe("Briar & Calder LLP");
    expect(seedData.staff).toHaveLength(12);
  });

  it("keeps every seeded identifier unique", () => {
    const ids = Object.values(seedData).flatMap((rows) => rows.map((row) => row.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("links every review output to a fixed run", () => {
    const runIds = new Set(seedIds.runs);
    expect(seedData.briefs.every((brief) => runIds.has(brief.run_id ?? ""))).toBe(true);
    expect(seedData.document_results.every((result) => runIds.has(result.run_id ?? ""))).toBe(true);
    expect(seedData.stalled_reports.every((report) => runIds.has(report.run_id ?? ""))).toBe(true);
    expect(seedData.operational_cases.every((item) => runIds.has(item.run_id ?? ""))).toBe(true);
  });

  it("seeds one reference case for every accounting and logistics agent", () => {
    expect(seedData.operational_cases).toHaveLength(6);
    expect(new Set(seedData.operational_cases.map((item) => item.agent)).size).toBe(6);
  });
});
