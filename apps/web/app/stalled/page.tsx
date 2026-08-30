import { getAgentQueue } from "@automutiny/db";
import { stalledWorkAgent } from "@automutiny/stalled-work-agent";
import { StalledScenarioRunner } from "@automutiny/stalled-work-agent/ui";

import { AgentQueuePage } from "../../components/agent-queue-page";

export const dynamic = "force-dynamic";

export default async function StalledQueueRoute() {
  const queue = await getAgentQueue("stalled-work");
  return (
    <AgentQueuePage agent={stalledWorkAgent} queue={queue}>
      <StalledScenarioRunner />
    </AgentQueuePage>
  );
}
