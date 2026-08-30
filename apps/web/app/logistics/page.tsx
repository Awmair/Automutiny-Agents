import type { Metadata } from "next";
import { VerticalOverviewPage } from "../../components/vertical-overview-page";

export const metadata: Metadata = {
  title: "Logistics Agents",
  description: "Lean AI agents for freight, logistics and transportation workflows.",
};

export default function LogisticsPage() {
  return (
    <VerticalOverviewPage
      name="Logistics"
      audience="freight and transportation companies"
      businessProblem="This agent team will target operational work where delays, manual handoffs and missed follow-up directly affect service and revenue."
    />
  );
}
