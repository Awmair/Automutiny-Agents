import { describe, expect, it } from "vitest";
import {
  AssessmentBatchSchema,
  StalledItemReviewSchema,
  StalledRunInputSchema,
} from "../src/schemas";

describe("stalled work boundaries", () => {
  it("limits the sandbox clock and model batch", () => {
    expect(StalledRunInputSchema.parse({ advance_days: 30 }).advance_days).toBe(30);
    expect(StalledRunInputSchema.safeParse({ advance_days: 1826 }).success).toBe(false);
    const assessments = Array.from({ length: 11 }, (_, index) => ({
      item_id: String(index),
      severity: "low",
      why: "Threshold met.",
      recommended_action: "internal_nudge",
      owner_role: "paralegal",
      confidence: 0.8,
    }));
    expect(AssessmentBatchSchema.safeParse({ assessments }).success).toBe(false);
  });

  it("requires a reason when a human dismisses a detection", () => {
    expect(StalledItemReviewSchema.safeParse({ decision: "dismiss" }).success).toBe(false);
    expect(
      StalledItemReviewSchema.safeParse({ decision: "dismiss", reason: "Recorded hold" }).success,
    ).toBe(true);
  });
});
