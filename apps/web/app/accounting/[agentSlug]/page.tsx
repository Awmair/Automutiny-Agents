import { accountingDocumentChaseScenarios } from "@automutiny/accounting-document-chase-agent";
import { accountingFilingReadinessScenarios } from "@automutiny/accounting-filing-readiness-agent";
import { accountingTransactionReviewScenarios } from "@automutiny/accounting-transaction-review-agent";
import { OperationalScenarioRunner } from "@automutiny/agent-ui";
import { getAgentQueue } from "@automutiny/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentQueuePage } from "../../../components/agent-queue-page";
import { AgentWorkflowExplainer } from "../../../components/agent-workflow-explainer";
import { operationalAgentByRoute, operationalWorkflows } from "../../../lib/operational-agents";

export const dynamic = "force-dynamic";

const descriptions: Record<string, string> = {
  "accounting-document-chase":
    "Test an AI document collection agent that tracks missing client records, prepares follow-up work and keeps accountant approval visible.",
  "accounting-transaction-review":
    "Test an AI transaction review agent that flags ledger exceptions, shows supporting evidence and returns posting decisions to accountants.",
  "accounting-filing-readiness":
    "Test an AI filing readiness agent that checks tax packages for missing records, failed gates and items requiring professional review.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}): Promise<Metadata> {
  const agent = operationalAgentByRoute("accounting", (await params).agentSlug);
  if (!agent?.id.startsWith("accounting-")) return {};
  return {
    title: `${agent.name} for Accounting Firms`,
    description: descriptions[agent.id],
    alternates: { canonical: agent.route },
  };
}

function runner(agentId: string) {
  if (agentId === "accounting-document-chase") {
    return (
      <OperationalScenarioRunner
        agentId={agentId}
        scenarios={accountingDocumentChaseScenarios}
        path={["Client file", "Checklist rules", "Follow-up review"]}
      />
    );
  }
  if (agentId === "accounting-transaction-review") {
    return (
      <OperationalScenarioRunner
        agentId={agentId}
        scenarios={accountingTransactionReviewScenarios}
        path={["Ledger batch", "Exception rules", "Posting review"]}
      />
    );
  }
  if (agentId === "accounting-filing-readiness") {
    return (
      <OperationalScenarioRunner
        agentId={agentId}
        scenarios={accountingFilingReadinessScenarios}
        path={["Filing package", "Readiness gates", "Professional review"]}
      />
    );
  }
  return null;
}

export default async function AccountingAgentRoute({
  params,
}: {
  params: Promise<{ agentSlug: string }>;
}) {
  const agent = operationalAgentByRoute("accounting", (await params).agentSlug);
  if (!agent?.id.startsWith("accounting-")) notFound();
  const workflow = operationalWorkflows.get(agent.id);
  if (!workflow) notFound();
  const queue = await getAgentQueue(agent.id);
  return (
    <AgentQueuePage
      agent={agent}
      queue={queue}
      organizationLabel="Accounting operations"
      backHref="/accounting"
      backLabel="Accounting agents"
      liveTestHref="#test-live"
    >
      <AgentWorkflowExplainer workflow={workflow} />
      {runner(agent.id)}
    </AgentQueuePage>
  );
}
