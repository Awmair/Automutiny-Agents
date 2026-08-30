import { defineAgent } from "@automutiny/agent-runtime";

export { getStalledReportDetail } from "./detail";
export { runStalledWork } from "./run";
export type { StalledItemReview } from "./schemas";
export { StalledItemReviewSchema, StalledRunInputSchema } from "./schemas";
export { submitStalledRun } from "./submit";

export const stalledWorkAgent = defineAgent({
  id: "stalled-work",
  label: "Agent 3",
  name: "Stalled Work & Monday Brief Agent",
  purpose: "Finds quiet or at-risk matters and prepares a linked owner brief and follow-ups.",
  humanBoundary: "Client-call choices, escalation and deadline strategy, reassignment and closure.",
  route: "/stalled",
});
