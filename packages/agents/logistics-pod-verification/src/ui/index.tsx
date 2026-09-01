"use client";
import { OperationalScenarioRunner } from "@automutiny/agent-ui";
import { logisticsPodVerificationAgent, logisticsPodVerificationScenarios } from "..";

export function LogisticsPodVerificationRunner() {
  return (
    <OperationalScenarioRunner
      agentId={logisticsPodVerificationAgent.id}
      scenarios={logisticsPodVerificationScenarios}
      path={["Delivery document", "Verification rules", "Billing review"]}
    />
  );
}
