import { defineAgent } from "@automutiny/agent-runtime";

export { getDocumentReviewDetail } from "./detail";
export { readDocumentScenario } from "./fixture";
export { runDocumentRouting } from "./run";
export { documentScenarios } from "./scenarios";
export type { DocumentReviewInput } from "./schemas";
export { DocumentReviewInputSchema } from "./schemas";
export { submitDocument } from "./submit";
export { documentRoutingWorkflow } from "./workflow";

export const documentRoutingAgent = defineAgent({
  id: "document-routing",
  label: "Agent 2",
  name: "Document Intake & Routing Agent",
  purpose: "Classifies an incoming document, checks completeness and proposes the right route.",
  humanBoundary:
    "Document authenticity, legal sufficiency, final routing and every client request.",
  route: "/documents",
});
