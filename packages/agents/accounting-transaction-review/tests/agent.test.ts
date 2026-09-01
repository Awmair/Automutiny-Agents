import { OperationalOutputSchema } from "@automutiny/agent-runtime";
import { describe, expect, it } from "vitest";
import {
  accountingTransactionReviewAgent,
  accountingTransactionReviewScenarios,
  analyzeAccountingTransactions,
} from "../src";

describe("Transaction Review Agent", () => {
  it("owns the labelled accounting route", () => {
    expect(accountingTransactionReviewAgent.route).toBe("/accounting/transaction-review");
  });

  it("finds duplicates and high-value unknown vendors without posting", () => {
    const scenario = accountingTransactionReviewScenarios[0];
    if (!scenario) throw new Error("Missing transaction-review scenario.");
    const result = analyzeAccountingTransactions(scenario.input);
    expect(result.priority).toBe("high");
    expect(result.exceptions).toHaveLength(2);
    expect(result.draft_message).toContain("no ledger changes");
  });

  it("returns a valid bounded result for every scenario", () => {
    for (const scenario of accountingTransactionReviewScenarios) {
      expect(
        OperationalOutputSchema.parse(analyzeAccountingTransactions(scenario.input)),
      ).toBeTruthy();
    }
  });
});
