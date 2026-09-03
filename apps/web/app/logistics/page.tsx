import { getAgentQueueSummaries } from "@automutiny/db";
import type { Metadata } from "next";
import { VerticalOverviewPage } from "../../components/vertical-overview-page";
import { logisticsAgents } from "../../lib/operational-agents";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AI Automation Agents for Logistics",
  description:
    "Test AI agents for load exceptions, POD verification and invoice reconciliation across freight and logistics operations.",
  alternates: { canonical: "/logistics" },
};

export default async function LogisticsPage() {
  const queueSummaries = await getAgentQueueSummaries();
  return (
    <VerticalOverviewPage
      name="Logistics"
      audience="freight and transportation companies"
      businessProblem="Three narrow workflows catch shipment, document and invoice exceptions before they become service failures or revenue leakage."
      agents={logisticsAgents}
      queueSummaries={queueSummaries}
    />
  );
}
