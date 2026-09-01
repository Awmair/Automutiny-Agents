"use client";
import { OperationalScenarioRunner } from "@automutiny/agent-ui";
import { logisticsInvoiceReconciliationAgent, logisticsInvoiceReconciliationScenarios } from "..";

export function LogisticsInvoiceReconciliationRunner() {
  return (
    <OperationalScenarioRunner
      agentId={logisticsInvoiceReconciliationAgent.id}
      scenarios={logisticsInvoiceReconciliationScenarios}
      path={["Invoice and rate", "Variance rules", "Payment review"]}
    />
  );
}
