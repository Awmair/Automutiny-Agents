import { OperationalOutputSchema } from "@automutiny/agent-runtime";
import { describe, expect, it } from "vitest";
import {
  accountingDocumentChaseAgent,
  accountingDocumentChaseScenarios,
  analyzeAccountingDocumentChase,
} from "../src";

describe("Client Document Chase Agent", () => {
  it("owns the labelled accounting route", () => {
    expect(accountingDocumentChaseAgent.route).toBe("/accounting/document-chase");
    expect(accountingDocumentChaseAgent.humanBoundary).toContain("person");
  });

  it("flags missing records without sending anything", () => {
    const scenario = accountingDocumentChaseScenarios[0];
    if (!scenario) throw new Error("Missing document-chase scenario.");
    const result = analyzeAccountingDocumentChase(scenario.input);
    expect(result.priority).toBe("high");
    expect(result.exceptions).toHaveLength(2);
    expect(result.recommended_action).toContain("Review");
  });

  it("returns a valid bounded result for every scenario", () => {
    for (const scenario of accountingDocumentChaseScenarios) {
      expect(
        OperationalOutputSchema.parse(analyzeAccountingDocumentChase(scenario.input)),
      ).toBeTruthy();
    }
  });
});
