import { getAgentQueue } from "@automutiny/db";
import { documentRoutingAgent, documentRoutingWorkflow } from "@automutiny/document-routing-agent";
import { DocumentScenarioRunner } from "@automutiny/document-routing-agent/ui";
import type { Metadata } from "next";
import { AgentQueuePage } from "../../components/agent-queue-page";
import { AgentWorkflowExplainer } from "../../components/agent-workflow-explainer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Legal Document Routing Agent for Law Firms",
  description:
    "Test an AI legal document routing agent that checks incoming files, prepares routing evidence and keeps final decisions with firm staff.",
  alternates: { canonical: "/documents" },
};

export default async function DocumentQueueRoute() {
  const queue = await getAgentQueue("document-routing");
  return (
    <AgentQueuePage agent={documentRoutingAgent} queue={queue} liveTestHref="#test-live">
      <AgentWorkflowExplainer workflow={documentRoutingWorkflow} />
      <DocumentScenarioRunner />
    </AgentQueuePage>
  );
}
