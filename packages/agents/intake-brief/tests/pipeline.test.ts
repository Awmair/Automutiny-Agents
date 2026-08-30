import { describe, expect, it } from "vitest";

import { matchContact } from "../src/context";
import { guardIntakeOutput } from "../src/guard";
import { readIntakeRules } from "../src/rules";
import { intakeScenarios } from "../src/scenarios";
import {
  BriefSchema,
  type IntakeBrief,
  IntakeReviewInputSchema,
  IntakeSubmissionSchema,
  type Qualification,
  QualificationSchema,
} from "../src/schemas";
import { intakeRequestKey } from "../src/submit";
import type { IntakeContact, IntakeLead } from "../src/types";

const validBrief: IntakeBrief = {
  brief_md:
    "## Who\nAlex Rivera.\n\n## What\nWorkplace inquiry.\n\n## History\nNo prior history found.\n\n## Fit\nPotential California employment matter.\n\n## Risks\nImportant facts remain missing.",
  next_action: "schedule_consult",
  next_action_reason: "Potential fit with enough information for an initial call.",
  reply_draft:
    "Thank you for contacting us. No representation exists unless the firm confirms it in writing. We will review the information provided before discussing next steps.",
  questions_for_call: ["Where did you work?"],
  confidence: 0.8,
};

const validQualification: Qualification = {
  practice_area: "employment",
  fit_score: 7,
  fit_reasons: ["Potential California employment matter"],
  disqualifiers: [],
  missing_facts: [],
  conflict_check_required: false,
  urgency: "medium",
  sol_flag: { present: false },
  confidence: 0.8,
};

function lead(raw: Record<string, unknown>): IntakeLead {
  return {
    id: "lead-1",
    firm_id: "firm-1",
    contact_id: null,
    source: "website",
    raw_json: raw,
    practice_area_guess: null,
    status: "new",
    visitor_session_id: null,
    created_at: "2026-08-30T00:00:00.000Z",
  };
}

function contact(id: string, name: string): IntakeContact {
  return {
    id,
    firm_id: "firm-1",
    name,
    email: null,
    phone: null,
    company: null,
    source: "website",
    notes: null,
    visitor_session_id: null,
  };
}

describe("intake schemas", () => {
  it("loads the trusted firm rulebook from the project source", async () => {
    const rules = await readIntakeRules();

    expect(rules).toContain("# Briar & Calder LLP intake rules");
    expect(rules).toContain("## Human decision boundary");
  });

  it("accepts the complete bounded output shapes", () => {
    expect(QualificationSchema.parse(validQualification)).toEqual(validQualification);
    expect(BriefSchema.parse(validBrief)).toEqual(validBrief);
  });

  it("requires all five brief headings", () => {
    expect(() => BriefSchema.parse({ ...validBrief, brief_md: "## Who\nAlex Rivera" })).toThrow(
      "Brief must include a What heading.",
    );
  });

  it("validates every prepared scenario and the review decision requirements", () => {
    expect(intakeScenarios).toHaveLength(6);
    for (const scenario of intakeScenarios) {
      expect(IntakeSubmissionSchema.parse(scenario.submission)).toEqual(scenario.submission);
    }
    expect(IntakeReviewInputSchema.safeParse({ decision: "reject" }).success).toBe(false);
    expect(
      IntakeReviewInputSchema.safeParse({ decision: "edit", edited_reply: "Updated reply." })
        .success,
    ).toBe(true);
  });

  it("creates a stable duplicate-submission key", () => {
    const submission = intakeScenarios[0]?.submission;
    if (!submission) throw new Error("The first intake scenario is missing.");
    expect(intakeRequestKey(submission)).toBe(intakeRequestKey({ ...submission }));
    expect(
      intakeRequestKey({
        ...submission,
        matter_description: `${submission.matter_description} Added fact.`,
      }),
    ).not.toBe(intakeRequestKey(submission));
  });
});

describe("contact matching", () => {
  it("does not merge histories when a name matches more than one contact", () => {
    const result = matchContact(lead({ name: "Alex Rivera" }), [
      contact("contact-1", "Alex Rivera"),
      contact("contact-2", "Alex Rivera"),
    ]);

    expect(result.basis).toBe("ambiguous");
    expect(result.contact).toBeNull();
    expect(result.candidateIds).toHaveLength(2);
  });
});

describe("intake guard", () => {
  it("routes urgent inquiries to partner review", () => {
    const result = guardIntakeOutput({ ...validQualification, urgency: "high" }, validBrief);

    expect(result.brief.next_action).toBe("partner_review");
    expect(result.needsHumanContext).toBe(true);
  });

  it("routes low-confidence inquiries to request information", () => {
    const result = guardIntakeOutput(
      { ...validQualification, confidence: 0.4 },
      { ...validBrief, confidence: 0.4 },
    );

    expect(result.brief.next_action).toBe("request_info");
    expect(result.checks).toContain("low_confidence_action_changed_to_request_info");
  });

  it("rejects prohibited outcome promises", () => {
    expect(() =>
      guardIntakeOutput(validQualification, {
        ...validBrief,
        reply_draft: "We guarantee that you will win.",
      }),
    ).toThrow("prohibited outcome promise");
  });
});
