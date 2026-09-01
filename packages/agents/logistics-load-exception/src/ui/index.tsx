"use client";
import { OperationalScenarioRunner } from "@automutiny/agent-ui";
import { logisticsLoadExceptionAgent, logisticsLoadExceptionScenarios } from "..";

export function LogisticsLoadExceptionRunner() {
  return (
    <OperationalScenarioRunner
      agentId={logisticsLoadExceptionAgent.id}
      scenarios={logisticsLoadExceptionScenarios}
      path={["Shipment events", "Exception rules", "Dispatch review"]}
    />
  );
}
