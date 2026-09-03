import { getAgentQueue } from "@automutiny/db";
import { stalledWorkAgent, stalledWorkWorkflow } from "@automutiny/stalled-work-agent";
import { StalledScenarioRunner } from "@automutiny/stalled-work-agent/ui";
import type { Metadata } from "next";
import { AgentQueuePage } from "../../components/agent-queue-page";
import { AgentWorkflowExplainer } from "../../components/agent-workflow-explainer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Stalled Matter Review Agent for Law Firms",
  description:
    "Test an AI agent that finds stalled legal work, prepares a review brief and returns every consequential action to firm staff.",
  alternates: { canonical: "/stalled" },
};

export default async function StalledQueueRoute() {
  const queue = await getAgentQueue("stalled-work");
  return (
    <AgentQueuePage agent={stalledWorkAgent} queue={queue} liveTestHref="#test-live">
      <AgentWorkflowExplainer workflow={stalledWorkWorkflow} />
      <StalledScenarioRunner />
    </AgentQueuePage>
  );
}
