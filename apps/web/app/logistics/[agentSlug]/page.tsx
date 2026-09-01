import { getAgentQueue } from "@automutiny/db";
import { OperationalScenarioRunner } from "@automutiny/agent-ui";
import { logisticsInvoiceReconciliationScenarios } from "@automutiny/logistics-invoice-reconciliation-agent";
import { logisticsLoadExceptionScenarios } from "@automutiny/logistics-load-exception-agent";
import { logisticsPodVerificationScenarios } from "@automutiny/logistics-pod-verification-agent";
import { notFound } from "next/navigation";

import { AgentQueuePage } from "../../../components/agent-queue-page";
import { operationalAgentByRoute } from "../../../lib/operational-agents";

export const dynamic = "force-dynamic";

function runner(agentId: string) {
  if (agentId === "logistics-load-exception") {
    return (
      <OperationalScenarioRunner
        agentId={agentId}
        scenarios={logisticsLoadExceptionScenarios}
        path={["Shipment events", "Exception rules", "Dispatch review"]}
      />
    );
  }
  if (agentId === "logistics-pod-verification") {
    return (
      <OperationalScenarioRunner
        agentId={agentId}
        scenarios={logisticsPodVerificationScenarios}
        path={["Delivery document", "Verification rules", "Billing review"]}
      />
    );
  }
  if (agentId === "logistics-invoice-reconciliation") {
    return (
      <OperationalScenarioRunner
        agentId={agentId}
        scenarios={logisticsInvoiceReconciliationScenarios}
        path={["Invoice and rate", "Variance rules", "Payment review"]}
      />
    );
  }
  return null;
}

export default async function LogisticsAgentRoute({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const agent = operationalAgentByRoute("logistics", (await params).agentSlug);
  if (!agent?.id.startsWith("logistics-")) notFound();
  const queue = await getAgentQueue(agent.id);
  return (
    <AgentQueuePage
      agent={agent}
      queue={queue}
      organizationLabel="Freight operations"
      backHref="/logistics"
      backLabel="Logistics agents"
    >
      {runner(agent.id)}
    </AgentQueuePage>
  );
}
