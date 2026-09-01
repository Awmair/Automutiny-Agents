"use client";

import { OperationalScenarioRunner } from "@automutiny/agent-ui";
import { accountingDocumentChaseAgent, accountingDocumentChaseScenarios } from "..";

export function AccountingDocumentChaseRunner() {
  return (
    <OperationalScenarioRunner
      agentId={accountingDocumentChaseAgent.id}
      scenarios={accountingDocumentChaseScenarios}
      path={["Client file", "Checklist rules", "Follow-up review"]}
    />
  );
}
