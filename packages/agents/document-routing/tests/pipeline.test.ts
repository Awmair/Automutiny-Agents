import { extractText } from "unpdf";
import { describe, expect, it } from "vitest";
import { readDocumentScenario } from "../src/fixture";
import { documentScenarios } from "../src/scenarios";
import { ClassificationSchema, DocumentReviewInputSchema } from "../src/schemas";
import { submitDocument } from "../src/submit";

describe("document routing inputs and guards", () => {
  it("keeps eight working PDF scenarios inside the agent folder", async () => {
    expect(documentScenarios).toHaveLength(8);
    for (const scenario of documentScenarios) {
      const fixture = await readDocumentScenario(scenario.id);
      expect(fixture.bytes.byteLength).toBeGreaterThan(500);
      const text = await extractText(fixture.bytes, { mergePages: true });
      expect(text.totalPages).toBe(1);
      expect(text.text).toContain("BRIAR & CALDER LLP");
    }
  });

  it("bounds classification evidence and review requirements", () => {
    expect(
      ClassificationSchema.safeParse({
        doc_type: "medical_bill",
        signed: null,
        parties: ["Malcolm Price"],
        dates: [],
        amounts: ["$4,820.00"],
        key_fields: {},
        is_scanned: false,
        confidence: 0.9,
        evidence: [{ field: "amount", quote: "Amount due: $4,820.00", page: 1 }],
      }).success,
    ).toBe(true);
    expect(DocumentReviewInputSchema.safeParse({ decision: "reject" }).success).toBe(false);
    expect(
      DocumentReviewInputSchema.safeParse({ decision: "reject", reason: "Wrong matter" }).success,
    ).toBe(true);
  });

  it("rejects unsupported and oversized uploads before database access", async () => {
    await expect(
      submitDocument(
        { bytes: new Uint8Array([1]), filename: "note.txt", mime: "text/plain" },
        { visitorSessionId: "fixture" },
      ),
    ).rejects.toThrow("Only PDF documents are accepted");
    await expect(
      submitDocument(
        {
          bytes: new Uint8Array(10 * 1024 * 1024 + 1),
          filename: "large.pdf",
          mime: "application/pdf",
        },
        { visitorSessionId: "fixture" },
      ),
    ).rejects.toThrow("PDFs must be 10 MB or smaller");
  });
});
