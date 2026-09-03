import { getAgentQueue } from "@automutiny/db";
import { stalledWorkAgent, stalledWorkWorkflow } from "@automutiny/stalled-work-agent";
import { StalledScenarioRunner } from "@automutiny/stalled-work-agent/ui";
import { AgentQueuePage } from "../../components/agent-queue-page";
import { AgentWorkflowExplainer } from "../../components/agent-workflow-explainer";

export const dynamic = "force-dynamic";

export default async function StalledQueueRoute() {
  const queue = await getAgentQueue("stalled-work");
  return (
    <AgentQueuePage agent={stalledWorkAgent} queue={queue} liveTestHref="#test-live">
      <AgentWorkflowExplainer workflow={stalledWorkWorkflow} />
      <StalledScenarioRunner />
    </AgentQueuePage>
  );
}
