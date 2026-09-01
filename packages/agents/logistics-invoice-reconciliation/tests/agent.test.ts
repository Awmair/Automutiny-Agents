import { OperationalOutputSchema } from "@automutiny/agent-runtime";
import { describe, expect, it } from "vitest";
import {
  analyzeLogisticsInvoice,
  logisticsInvoiceReconciliationAgent,
  logisticsInvoiceReconciliationScenarios,
} from "../src";

describe("Invoice Reconciliation Agent", () => {
  it("owns the labelled logistics route", () => {
    expect(logisticsInvoiceReconciliationAgent.route).toBe("/logistics/invoice-reconciliation");
  });

  it("holds an invoice with an unapproved accessorial", () => {
    const scenario = logisticsInvoiceReconciliationScenarios[0];
    if (!scenario) throw new Error("Missing invoice scenario.");
    const result = analyzeLogisticsInvoice(scenario.input);
    expect(result.status).toBe("blocked");
    expect(result.priority).toBe("high");
    expect(result.headline).toBe("1 invoice exception needs AP review");
    expect(result.draft_message).toContain("No payment was approved");
  });

  it("returns a valid bounded result for every scenario", () => {
    for (const scenario of logisticsInvoiceReconciliationScenarios) {
      expect(OperationalOutputSchema.parse(analyzeLogisticsInvoice(scenario.input))).toBeTruthy();
    }
  });
});
