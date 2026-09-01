import { describe, expect, it } from "vitest";
import { OperationalReviewInputSchema } from "../src";

describe("operational review contract", () => {
  it("requires edited content and rejection reasons", () => {
    expect(OperationalReviewInputSchema.safeParse({ decision: "edit" }).success).toBe(false);
    expect(OperationalReviewInputSchema.safeParse({ decision: "reject" }).success).toBe(false);
    expect(
      OperationalReviewInputSchema.safeParse({ decision: "edit", edited_message: "Reviewed note." })
        .success,
    ).toBe(true);
  });
});
