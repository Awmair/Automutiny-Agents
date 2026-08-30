import { getAgentQueue } from "@automutiny/db";
import { documentRoutingAgent } from "@automutiny/document-routing-agent";
import { DocumentScenarioRunner } from "@automutiny/document-routing-agent/ui";

import { AgentQueuePage } from "../../components/agent-queue-page";

export const dynamic = "force-dynamic";

export default async function DocumentQueueRoute() {
  const queue = await getAgentQueue("document-routing");
  return (
    <AgentQueuePage agent={documentRoutingAgent} queue={queue}>
      <DocumentScenarioRunner />
    </AgentQueuePage>
  );
}
