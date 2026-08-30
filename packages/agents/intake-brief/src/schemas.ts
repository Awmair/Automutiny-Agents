import { z } from "zod";

export const practiceAreas = [
  "personal_injury",
  "employment",
  "business_litigation",
  "estate_planning",
  "other",
  "unknown",
] as const;

export const nextActions = [
  "schedule_consult",
  "request_info",
  "refer_out",
  "decline",
  "partner_review",
] as const;

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function boundedWords(maximum: number) {
  return z
    .string()
    .trim()
    .min(1)
    .refine((value) => wordCount(value) <= maximum, `Must contain at most ${maximum} words.`);
}

export const QualificationSchema = z
  .object({
    practice_area: z.enum(practiceAreas),
    fit_score: z.number().int().min(0).max(10),
    fit_reasons: z.array(z.string().trim().min(1).max(240)).max(4),
    disqualifiers: z.array(z.string().trim().min(1).max(240)).max(4),
    missing_facts: z.array(z.string().trim().min(1).max(240)).max(8),
    conflict_check_required: z.boolean(),
    urgency: z.enum(["low", "medium", "high"]),
    sol_flag: z.object({
      present: z.boolean(),
      note: z.string().trim().min(1).max(240).nullish(),
    }),
    confidence: z.number().min(0).max(1),
  })
  .strict();

const requiredBriefHeadings = ["Who", "What", "History", "Fit", "Risks"] as const;

export const BriefSchema = z
  .object({
    brief_md: boundedWords(180),
    next_action: z.enum(nextActions),
    next_action_reason: z.string().trim().min(1),
    reply_draft: boundedWords(120),
    questions_for_call: z.array(z.string().trim().min(1)).max(5),
    confidence: z.number().min(0).max(1),
  })
  .strict()
  .superRefine((brief, context) => {
    for (const heading of requiredBriefHeadings) {
      const pattern = new RegExp(`(?:^|\\n)#{1,6}\\s*${heading}\\b`, "i");
      if (!pattern.test(brief.brief_md)) {
        context.addIssue({
          code: "custom",
          path: ["brief_md"],
          message: `Brief must include a ${heading} heading.`,
        });
      }
    }
  });

export const IntakeSubmissionSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(254),
    phone: z.string().trim().max(40),
    company: z.string().trim().max(160),
    matter_description: z.string().trim().min(3).max(5_000),
    how_found_us: z.string().trim().min(2).max(120),
    urgency: z.string().trim().min(2).max(500),
  })
  .strict();

export const IntakeReviewInputSchema = z
  .object({
    decision: z.enum(["approve", "edit", "reject"]),
    edited_reply: boundedWords(120).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict()
  .superRefine((review, context) => {
    if (review.decision === "edit" && !review.edited_reply) {
      context.addIssue({
        code: "custom",
        path: ["edited_reply"],
        message: "An edited reply is required for an edit decision.",
      });
    }
    if (review.decision === "reject" && !review.reason) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "A reason is required for a rejection.",
      });
    }
  });

export type Qualification = z.infer<typeof QualificationSchema>;
export type IntakeBrief = z.infer<typeof BriefSchema>;
export type IntakeSubmission = z.infer<typeof IntakeSubmissionSchema>;
export type IntakeReviewInput = z.infer<typeof IntakeReviewInputSchema>;
export type NextAction = (typeof nextActions)[number];
