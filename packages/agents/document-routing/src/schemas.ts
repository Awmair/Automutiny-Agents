import { z } from "zod";

export const documentTypes = [
  "engagement_agreement",
  "identity_document",
  "incident_report",
  "insurance_document",
  "medical_record",
  "medical_bill",
  "wage_record",
  "personnel_record",
  "complaint_or_hr_report",
  "contract",
  "invoice_or_payment_record",
  "demand_or_settlement_correspondence",
  "pleading_or_court_notice",
  "discovery_document",
  "other_correspondence",
  "unknown",
] as const;

export const EvidenceSchema = z.object({
  field: z.string().min(1),
  quote: z.string().min(1).max(120),
  page: z.number().int().positive(),
});

const partyValue = z
  .union([
    z.string(),
    z.object({
      name: z.string(),
      role: z.string().optional(),
      evidence: EvidenceSchema.omit({ field: true }).optional(),
    }),
  ])
  .transform((value) => (typeof value === "string" ? value : value.name));
const dateValue = z
  .union([
    z.string(),
    z.object({
      date: z.string(),
      type: z.string().optional(),
      evidence: EvidenceSchema.omit({ field: true }).optional(),
    }),
  ])
  .transform((value) => (typeof value === "string" ? value : value.date));
const amountValue = z
  .union([
    z.string(),
    z.object({
      amount: z.union([z.string(), z.number()]),
      currency: z.string().optional(),
      description: z.string().optional(),
      evidence: EvidenceSchema.omit({ field: true }).optional(),
    }),
  ])
  .transform((value) =>
    typeof value === "string"
      ? value
      : `${value.amount}${value.currency ? ` ${value.currency}` : ""}`,
  );
const keyFieldValue = z
  .union([
    z.string(),
    z.object({ value: z.string(), evidence: EvidenceSchema.omit({ field: true }).optional() }),
  ])
  .transform((value) => (typeof value === "string" ? value : value.value));

export const ClassificationSchema = z.object({
  doc_type: z.enum(documentTypes),
  signed: z.boolean().nullable(),
  parties: z.array(partyValue).max(12),
  dates: z.array(dateValue).max(12),
  amounts: z.array(amountValue).max(12),
  key_fields: z.record(z.string(), keyFieldValue).default({}),
  is_scanned: z.boolean(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(EvidenceSchema).max(24),
});

export const MatchSchema = z.object({
  matter_id: z.string().uuid().nullable(),
  reason: z.string().max(160),
  confidence: z.number().min(0).max(1),
});

export const DocumentReviewInputSchema = z
  .object({
    decision: z.enum(["approve", "edit", "reject"]),
    reason: z.string().max(300).optional(),
    matter_id: z.string().uuid().nullable().optional(),
    reviewer_role: z.enum(["paralegal", "associate", "partner", "office_manager"]).optional(),
    priority: z.enum(["normal", "high", "needs_human"]).optional(),
  })
  .superRefine((value, context) => {
    if (value.decision === "reject" && !value.reason?.trim()) {
      context.addIssue({ code: "custom", message: "A rejection reason is required." });
    }
  });

export type Classification = z.infer<typeof ClassificationSchema>;
export type DocumentReviewInput = z.infer<typeof DocumentReviewInputSchema>;
