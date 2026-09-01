import { accountingDocumentChaseScenarios } from "@automutiny/accounting-document-chase-agent";
import { accountingFilingReadinessScenarios } from "@automutiny/accounting-filing-readiness-agent";
import { accountingTransactionReviewScenarios } from "@automutiny/accounting-transaction-review-agent";
import { OperationalScenarioRunner } from "@automutiny/agent-ui";
import { getAgentQueue } from "@automutiny/db";
import { notFound } from "next/navigation";

import { AgentQueuePage } from "../../../components/agent-queue-page";
import { operationalAgentByRoute } from "../../../lib/operational-agents";

export const dynamic = "force-dynamic";

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
  const queue = await getAgentQueue(agent.id);
  return (
    <AgentQueuePage
      agent={agent}
      queue={queue}
      organizationLabel="Accounting operations"
      backHref="/accounting"
      backLabel="Accounting agents"
    >
      {runner(agent.id)}
    </AgentQueuePage>
  );
}
