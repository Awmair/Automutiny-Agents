"use client";
import { OperationalScenarioRunner } from "@automutiny/agent-ui";
import { accountingTransactionReviewAgent, accountingTransactionReviewScenarios } from "..";

export function AccountingTransactionReviewRunner() {
  return (
    <OperationalScenarioRunner
      agentId={accountingTransactionReviewAgent.id}
      scenarios={accountingTransactionReviewScenarios}
      path={["Ledger batch", "Exception rules", "Posting review"]}
    />
  );
}
