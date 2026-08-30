import { GuardError } from "./errors";

function parseArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function mockStructuredValue(step: string, user: string): unknown {
  if (step === "qualify") {
    return {
      practice_area: "unknown",
      fit_score: 5,
      fit_reasons: ["Mock provider produced a review-only qualification."],
      disqualifiers: [],
      missing_facts: ["A firm professional must confirm the relevant matter facts."],
      conflict_check_required: false,
      urgency: "low",
      sol_flag: { present: false, note: null },
      confidence: 0.7,
    };
  }
  if (step === "draft") {
    return {
      brief_md:
        "## Who\nA new inquiry.\n## What\nDetails require review.\n## History\nNo verified history was supplied.\n## Fit\nFurther information is needed.\n## Risks\nHuman review is required.",
      next_action: "request_info",
      next_action_reason: "The mock provider does not make a client-facing decision.",
      reply_draft:
        "Thank you for contacting the firm. We need more information before reviewing next steps. No representation exists unless the firm confirms it in writing.",
      questions_for_call: ["What outcome are you seeking?"],
      confidence: 0.7,
    };
  }
  if (step === "classify") {
    return {
      doc_type: "unknown",
      signed: null,
      parties: [],
      dates: [],
      amounts: [],
      key_fields: {},
      is_scanned: false,
      confidence: 0.6,
      evidence: [],
    };
  }
  if (step === "match-ambiguous") {
    return {
      matter_id: null,
      reason: "Mock provider leaves ambiguous routing for human review.",
      confidence: 0.6,
    };
  }
  if (step.startsWith("assess-batch-")) {
    return {
      assessments: parseArray(user)
        .slice(0, 10)
        .map((entry) => {
          const item = entry as { id?: string; kind?: string; baseline_severity?: string };
          const kind = item.kind ?? "unknown";
          return {
            item_id: item.id ?? "unknown",
            severity: ["low", "medium", "high"].includes(item.baseline_severity ?? "")
              ? item.baseline_severity
              : "medium",
            why: "The deterministic firm threshold was met; human review remains required.",
            recommended_action:
              kind === "stale_client_contact" || kind === "unreturned_document_request"
                ? "client_followup"
                : kind === "at_risk_deadline"
                  ? "partner_escalation"
                  : "internal_nudge",
            owner_role: kind === "at_risk_deadline" ? "partner" : "paralegal",
            confidence: 0.7,
          };
        }),
    };
  }
  throw new GuardError(`No mock output is defined for the ${step} step.`);
}
