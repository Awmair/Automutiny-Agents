import type { Metadata } from "next";
import { VerticalOverviewPage } from "../../components/vertical-overview-page";

export const metadata: Metadata = {
  title: "Accounting Agents",
  description: "Lean AI agents for accounting, CPA and tax firm workflows.",
};

export default function AccountingPage() {
  return (
    <VerticalOverviewPage
      name="Accounting"
      audience="accounting, CPA and tax firms"
      businessProblem="This agent team will target repeated firm work where review queues, manual preparation and missed follow-up consume valuable staff time."
    />
  );
}
