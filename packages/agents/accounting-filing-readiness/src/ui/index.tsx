"use client";
import { OperationalScenarioRunner } from "@automutiny/agent-ui";
import { accountingFilingReadinessAgent, accountingFilingReadinessScenarios } from "..";

export function AccountingFilingReadinessRunner() {
  return (
    <OperationalScenarioRunner
      agentId={accountingFilingReadinessAgent.id}
      scenarios={accountingFilingReadinessScenarios}
      path={["Filing package", "Readiness gates", "Professional review"]}
    />
  );
}
