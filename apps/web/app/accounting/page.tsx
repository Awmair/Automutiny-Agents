import { getAgentQueueSummaries } from "@automutiny/db";
import type { Metadata } from "next";
import { VerticalOverviewPage } from "../../components/vertical-overview-page";
import { accountingAgents } from "../../lib/operational-agents";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accounting Agents",
  description: "Lean AI agents for accounting, CPA and tax firm workflows.",
};

export default async function AccountingPage() {
  const queueSummaries = await getAgentQueueSummaries();
  return (
    <VerticalOverviewPage
      name="Accounting"
      audience="accounting, CPA and tax firms"
      businessProblem="Three narrow workflows reduce document chasing, ledger review and filing-readiness work while the accountant keeps every consequential decision."
      agents={accountingAgents}
      queueSummaries={queueSummaries}
    />
  );
}
