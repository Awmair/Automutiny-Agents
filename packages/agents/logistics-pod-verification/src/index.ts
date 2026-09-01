import {
  defineAgent,
  type OperationalScenario,
  runOperationalCase,
} from "@automutiny/agent-runtime";
import type { OperationalOutput, SupabaseClient } from "@automutiny/db";

export type PodVerificationInput = Record<string, unknown> & {
  load_id: string;
  customer: string;
  expected_receiver: string;
  extracted_load_id: string | null;
  receiver_name: string | null;
  delivered_date: string | null;
  signed: boolean;
  image_quality: "clear" | "blurred" | "partial";
  damage_notation: string | null;
};

export const logisticsPodVerificationAgent = defineAgent({
  id: "logistics-pod-verification",
  label: "Logistics Agent 2",
  name: "POD Verification Agent",
  purpose: "Matches delivery evidence to a load and checks billing-critical fields.",
  humanBoundary:
    "A person confirms authenticity, damage status, document acceptance and billing release.",
  route: "/logistics/pod-verification",
});

export const logisticsPodVerificationScenarios = [
  {
    id: "pod-4821-damage",
    label: "Signed POD with damage note",
    summary: "The load matches, but a receiver damage notation blocks normal billing release.",
    subject: "POD · Load 4821 · Western Grocers",
    input: {
      load_id: "4821",
      customer: "Western Grocers",
      expected_receiver: "Western Grocers LA DC",
      extracted_load_id: "4821",
      receiver_name: "Western Grocers LA DC",
      delivered_date: "2026-08-31",
      signed: true,
      image_quality: "clear",
      damage_notation: "Two cartons crushed on arrival",
    },
  },
  {
    id: "pod-5174-blurred",
    label: "Unreadable delivery document",
    summary: "The image is blurred and the load reference could not be verified.",
    subject: "POD · Possible load 5174",
    input: {
      load_id: "5174",
      customer: "Redline Components",
      expected_receiver: "Redline Tulsa Plant",
      extracted_load_id: null,
      receiver_name: "Redline Tulsa Plant",
      delivered_date: "2026-08-31",
      signed: true,
      image_quality: "blurred",
      damage_notation: null,
    },
  },
  {
    id: "pod-5290-clean",
    label: "Complete POD",
    summary: "Load, receiver, date, signature and image quality all pass the configured checks.",
    subject: "POD · Load 5290 · Sierra Office Supply",
    input: {
      load_id: "5290",
      customer: "Sierra Office Supply",
      expected_receiver: "Sierra Sacramento DC",
      extracted_load_id: "5290",
      receiver_name: "Sierra Sacramento DC",
      delivered_date: "2026-08-31",
      signed: true,
      image_quality: "clear",
      damage_notation: null,
    },
  },
] satisfies readonly OperationalScenario<PodVerificationInput>[];

export function analyzeLogisticsPod(input: PodVerificationInput): OperationalOutput {
  const loadMatch = input.extracted_load_id === input.load_id;
  const receiverMatch =
    input.receiver_name?.toLowerCase() === input.expected_receiver.toLowerCase();
  const exceptions = [
    ...(!loadMatch
      ? [
          {
            title: "Load reference",
            evidence: input.extracted_load_id
              ? `Document shows ${input.extracted_load_id}; shipment record expects ${input.load_id}.`
              : "No readable load reference was extracted.",
            impact: "The document cannot be linked confidently to the shipment.",
            action: "Verify the original document and match the correct load manually.",
          },
        ]
      : []),
    ...(!receiverMatch
      ? [
          {
            title: "Receiver mismatch",
            evidence: `Document receiver: ${input.receiver_name ?? "not found"}; expected: ${input.expected_receiver}.`,
            impact: "Delivery location evidence may not match the shipment record.",
            action: "Confirm the receiver against the dispatch record.",
          },
        ]
      : []),
    ...(!input.delivered_date
      ? [
          {
            title: "Delivery date",
            evidence: "No delivery date was extracted.",
            impact: "Delivery completion timing is unverified.",
            action: "Check the original image for the delivery date.",
          },
        ]
      : []),
    ...(!input.signed
      ? [
          {
            title: "Signature",
            evidence: "No receiver signature is recorded.",
            impact: "Proof of acceptance is incomplete.",
            action: "Request a signed POD or approved alternate evidence.",
          },
        ]
      : []),
    ...(input.image_quality !== "clear"
      ? [
          {
            title: "Image quality",
            evidence: `Document quality is marked ${input.image_quality}.`,
            impact: "Critical fields may be unreadable or incomplete.",
            action: "Request a clearer full-page image.",
          },
        ]
      : []),
    ...(input.damage_notation
      ? [
          {
            title: "Damage notation",
            evidence: input.damage_notation,
            impact: "The delivery may require claims or customer-service review before billing.",
            action: "Route the damage note to operations for human review.",
          },
        ]
      : []),
  ];
  const blocked =
    !loadMatch ||
    !input.signed ||
    input.image_quality !== "clear" ||
    Boolean(input.damage_notation);

  return {
    headline: exceptions.length
      ? `${exceptions.length} POD exception${exceptions.length === 1 ? "" : "s"} need review`
      : "POD passed all configured verification checks",
    summary: `The document was checked against load ${input.load_id}, the expected receiver, delivery date, signature and image-quality rules.`,
    status: blocked ? "blocked" : exceptions.length ? "needs_review" : "ready",
    priority: input.damage_notation || !loadMatch ? "high" : exceptions.length ? "medium" : "low",
    confidence: input.image_quality === "clear" ? 0.99 : 0.76,
    signals: [
      {
        label: "Load match",
        value: loadMatch ? "Matched" : "Unverified",
        tone: loadMatch ? "positive" : "alert",
      },
      {
        label: "Receiver",
        value: receiverMatch ? "Matched" : "Review",
        tone: receiverMatch ? "positive" : "watch",
      },
      {
        label: "Signature",
        value: input.signed ? "Present" : "Missing",
        tone: input.signed ? "positive" : "alert",
      },
      {
        label: "Image",
        value: input.image_quality,
        tone: input.image_quality === "clear" ? "positive" : "alert",
      },
    ],
    exceptions: exceptions.map((exception) => ({
      title: exception.title,
      evidence: exception.evidence,
      impact: exception.impact,
      recommended_action: exception.action,
    })),
    checks: [
      {
        label: "Shipment match",
        status: loadMatch ? "pass" : "fail",
        detail: loadMatch
          ? "Extracted load reference matches."
          : "Load reference needs manual verification.",
      },
      {
        label: "Delivery acceptance",
        status: input.signed ? "pass" : "fail",
        detail: input.signed ? "Receiver signature is present." : "Receiver signature is absent.",
      },
      {
        label: "Document readability",
        status: input.image_quality === "clear" ? "pass" : "fail",
        detail: `Image quality is ${input.image_quality}.`,
      },
      {
        label: "Damage review",
        status: input.damage_notation ? "fail" : "pass",
        detail: input.damage_notation ?? "No damage notation was extracted.",
      },
    ],
    recommended_action: exceptions.length
      ? "Verify the flagged document fields before accepting the POD or releasing billing."
      : "A billing specialist may perform the final POD acceptance check.",
    draft_message: exceptions.length
      ? `POD for load ${input.load_id} needs review: ${exceptions.map((item) => item.title).join(", ")}. Billing release remains locked.`
      : `POD for load ${input.load_id} passed the configured checks. Final acceptance and billing release remain human decisions.`,
  };
}

export function submitLogisticsPodVerification(
  scenarioId: string,
  options: { client?: SupabaseClient; visitorSessionId: string },
) {
  const scenario = logisticsPodVerificationScenarios.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error("Unknown POD Verification scenario.");
  return runOperationalCase({
    agentId: logisticsPodVerificationAgent.id,
    scenario,
    analyze: analyzeLogisticsPod,
    ...options,
  });
}
