import { OperationalOutputSchema } from "@automutiny/agent-runtime";
import { describe, expect, it } from "vitest";
import {
  accountingFilingReadinessAgent,
  accountingFilingReadinessScenarios,
  analyzeAccountingFilingReadiness,
} from "../src";

describe("Filing Readiness Agent", () => {
  it("owns the labelled accounting route", () => {
    expect(accountingFilingReadinessAgent.route).toBe("/accounting/filing-readiness");
  });

  it("blocks filing when gates remain open", () => {
    const scenario = accountingFilingReadinessScenarios[0];
    if (!scenario) throw new Error("Missing filing-readiness scenario.");
    const result = analyzeAccountingFilingReadiness(scenario.input);
    expect(result.status).toBe("blocked");
    expect(result.priority).toBe("high");
    expect(result.draft_message).toContain("No filing was submitted");
  });

  it("returns a valid bounded result for every scenario", () => {
    for (const scenario of accountingFilingReadinessScenarios) {
      expect(
        OperationalOutputSchema.parse(analyzeAccountingFilingReadiness(scenario.input)),
      ).toBeTruthy();
    }
  });
});
