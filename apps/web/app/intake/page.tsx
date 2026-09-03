import { getAgentQueue } from "@automutiny/db";
import { intakeBriefAgent, intakeBriefWorkflow } from "@automutiny/intake-brief-agent";
import { IntakeScenarioRunner } from "@automutiny/intake-brief-agent/ui";
import { AgentQueuePage } from "../../components/agent-queue-page";
import { AgentWorkflowExplainer } from "../../components/agent-workflow-explainer";

export const dynamic = "force-dynamic";

export default async function IntakeQueueRoute() {
  const queue = await getAgentQueue("intake-brief");
  return (
    <AgentQueuePage agent={intakeBriefAgent} queue={queue} liveTestHref="#test-live">
      <AgentWorkflowExplainer workflow={intakeBriefWorkflow} />
      <IntakeScenarioRunner />
    </AgentQueuePage>
  );
}
