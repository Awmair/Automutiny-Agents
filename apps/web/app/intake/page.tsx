import { getAgentQueue } from "@automutiny/db";
import { intakeBriefAgent } from "@automutiny/intake-brief-agent";
import { IntakeScenarioRunner } from "@automutiny/intake-brief-agent/ui";

import { AgentQueuePage } from "../../components/agent-queue-page";

export const dynamic = "force-dynamic";

export default async function IntakeQueueRoute() {
  const queue = await getAgentQueue("intake-brief");
  return (
    <AgentQueuePage agent={intakeBriefAgent} queue={queue}>
      <IntakeScenarioRunner />
    </AgentQueuePage>
  );
}
