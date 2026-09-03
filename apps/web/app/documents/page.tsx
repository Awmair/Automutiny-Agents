import { getAgentQueue } from "@automutiny/db";
import { documentRoutingAgent, documentRoutingWorkflow } from "@automutiny/document-routing-agent";
import { DocumentScenarioRunner } from "@automutiny/document-routing-agent/ui";
import { AgentQueuePage } from "../../components/agent-queue-page";
import { AgentWorkflowExplainer } from "../../components/agent-workflow-explainer";

export const dynamic = "force-dynamic";

export default async function DocumentQueueRoute() {
  const queue = await getAgentQueue("document-routing");
  return (
    <AgentQueuePage agent={documentRoutingAgent} queue={queue} liveTestHref="#test-live">
      <AgentWorkflowExplainer workflow={documentRoutingWorkflow} />
      <DocumentScenarioRunner />
    </AgentQueuePage>
  );
}
