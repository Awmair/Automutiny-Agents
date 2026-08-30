import { defineAgent } from "@automutiny/agent-runtime";

export { getIntakeReviewDetail } from "./detail";
export { assertSafeIntakeReply, guardIntakeOutput } from "./guard";
export { runIntake } from "./run";
export { intakeScenarios } from "./scenarios";
export type {
  IntakeBrief,
  IntakeReviewInput,
  IntakeSubmission,
  NextAction,
  Qualification,
} from "./schemas";
export {
  BriefSchema,
  IntakeReviewInputSchema,
  IntakeSubmissionSchema,
  nextActions,
  practiceAreas,
  QualificationSchema,
} from "./schemas";
export { submitIntake } from "./submit";
export type { ContextBundle, IntakeReviewDetail, RunIntakeResult } from "./types";

export const intakeBriefAgent = defineAgent({
  id: "intake-brief",
  label: "Agent 1",
  name: "Intake Brief Agent",
  purpose: "Turns a new inquiry and existing firm context into a review-ready intake brief.",
  humanBoundary: "Whether to take the matter, what to tell the client and any legal assessment.",
  route: "/intake",
});
