import { z } from "zod";

export const AssessmentSchema = z.object({
  item_id: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  why: z.string().max(260),
  recommended_action: z.enum([
    "client_followup",
    "internal_nudge",
    "partner_escalation",
    "deadline_motion_prep",
    "close_or_archive",
  ]),
  owner_role: z.enum(["paralegal", "associate", "partner", "office_manager"]),
  confidence: z.number().min(0).max(1),
});
export const AssessmentBatchSchema = z.object({ assessments: z.array(AssessmentSchema).max(10) });
export const StalledRunInputSchema = z.object({
  advance_days: z.number().int().min(0).max(1825).default(0),
});
export const StalledItemReviewSchema = z
  .object({
    decision: z.enum(["approve", "snooze_7d", "dismiss"]),
    reason: z.string().max(300).optional(),
  })
  .superRefine((value, context) => {
    if (value.decision === "dismiss" && !value.reason?.trim())
      context.addIssue({ code: "custom", message: "A dismissal reason is required." });
  });
export type Assessment = z.infer<typeof AssessmentSchema>;
export type StalledItemReview = z.infer<typeof StalledItemReviewSchema>;
