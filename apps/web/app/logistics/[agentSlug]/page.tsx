import { OperationalScenarioRunner } from "@automutiny/agent-ui";
import { getAgentQueue } from "@automutiny/db";
import { logisticsInvoiceReconciliationScenarios } from "@automutiny/logistics-invoice-reconciliation-agent";
import { logisticsLoadExceptionScenarios } from "@automutiny/logistics-load-exception-agent";
import { logisticsPodVerificationScenarios } from "@automutiny/logistics-pod-verification-agent";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentQueuePage } from "../../../components/agent-queue-page";
import { AgentWorkflowExplainer } from "../../../components/agent-workflow-explainer";
import { operationalAgentByRoute, operationalWorkflows } from "../../../lib/operational-agents";

export const dynamic = "force-dynamic";

const descriptions: Record<string, string> = {
  "logistics-load-exception":
    "Test an AI load exception agent that identifies shipment risks, prepares dispatch evidence and keeps operational decisions with staff.",
  "logistics-pod-verification":
    "Test an AI POD verification agent that checks delivery documents, flags missing evidence and prepares billing review for logistics teams.",
  "logistics-invoice-reconciliation":
    "Test an AI invoice reconciliation agent that compares freight invoices, rates and exceptions before human payment approval.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}): Promise<Metadata> {
  const agent = operationalAgentByRoute("logistics", (await params).agentSlug);
  if (!agent?.id.startsWith("logistics-")) return {};
  return {
    title: `${agent.name} for Logistics Teams`,
    description: descriptions[agent.id],
    alternates: { canonical: agent.route },
  };
}

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
  const workflow = operationalWorkflows.get(agent.id);
  if (!workflow) notFound();
  const queue = await getAgentQueue(agent.id);
  return (
    <AgentQueuePage
      agent={agent}
      queue={queue}
      organizationLabel="Freight operations"
      backHref="/logistics"
      backLabel="Logistics agents"
      liveTestHref="#test-live"
    >
      <AgentWorkflowExplainer workflow={workflow} />
      {runner(agent.id)}
    </AgentQueuePage>
  );
}
