import { assertSafeDraft, GuardError, minimumConfidence } from "@automutiny/agent-runtime";

import type { IntakeBrief, Qualification } from "./schemas";
import type { GuardOutcome } from "./types";

const prohibitedPromises = [/\bguarantee\b/iu, /\bwill win\b/iu, /\byou have a strong case\b/iu];
const disqualifierActions = new Set(["refer_out", "decline", "partner_review"]);

export function assertSafeIntakeReply(reply: string) {
  assertSafeDraft(reply);
  if (prohibitedPromises.some((pattern) => pattern.test(reply))) {
    throw new GuardError("Reply draft contains a prohibited outcome promise.");
  }
}

export function guardIntakeOutput(
  qualification: Qualification,
  originalBrief: IntakeBrief,
): GuardOutcome {
  assertSafeDraft(originalBrief.brief_md);
  assertSafeIntakeReply(originalBrief.reply_draft);

  let brief = { ...originalBrief };
  const checks = ["schema_valid", "sensitive_data_scan_passed", "promise_scan_passed"];
  let needsHumanContext =
    Math.min(qualification.confidence, brief.confidence) < minimumConfidence();

  if (qualification.conflict_check_required || qualification.urgency === "high") {
    if (brief.next_action !== "partner_review") {
      brief = {
        ...brief,
        next_action: "partner_review",
        next_action_reason:
          "A possible conflict or urgent timing issue requires review by a qualified firm professional.",
      };
      checks.push("action_changed_to_partner_review");
    }
    needsHumanContext = true;
  } else if (qualification.disqualifiers.length > 0) {
    if (!disqualifierActions.has(brief.next_action)) {
      brief = {
        ...brief,
        next_action: "partner_review",
        next_action_reason: "A stated disqualifier requires a human decision before any response.",
      };
      checks.push("disqualifier_action_corrected");
    }
    needsHumanContext = true;
  } else if (needsHumanContext) {
    brief = {
      ...brief,
      next_action: "request_info",
      next_action_reason:
        "Confidence is below the operating threshold, so more information is needed.",
    };
    checks.push("low_confidence_action_changed_to_request_info");
  } else if (
    qualification.missing_facts.length > 0 &&
    brief.next_action !== "request_info" &&
    brief.next_action !== "schedule_consult"
  ) {
    brief = {
      ...brief,
      next_action: "request_info",
      next_action_reason:
        "Required intake facts are missing and should be gathered before a decision.",
    };
    checks.push("missing_facts_action_corrected");
  }

  checks.push("human_review_required");
  return { brief, needsHumanContext, checks };
}
