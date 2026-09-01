import {
  defineAgent,
  type OperationalScenario,
  runOperationalCase,
} from "@automutiny/agent-runtime";
import type { OperationalOutput, SupabaseClient } from "@automutiny/db";

export type FilingReadinessInput = Record<string, unknown> & {
  client: string;
  filing: string;
  deadline_days: number;
  checklist: Array<{ label: string; complete: boolean }>;
  reviewer_approved: boolean;
  authorization_received: boolean;
  payment_confirmed: boolean;
};

export const accountingFilingReadinessAgent = defineAgent({
  id: "accounting-filing-readiness",
  label: "Accounting Agent 3",
  name: "Filing Readiness Agent",
  purpose: "Checks filing gates, ranks blockers and prepares the final review handoff.",
  humanBoundary: "A licensed professional confirms the return, authorization, payment and filing.",
  route: "/accounting/filing-readiness",
});

export const accountingFilingReadinessScenarios = [
  {
    id: "harbor-works-blocked",
    label: "Deadline risk and missing approval",
    summary: "The package is due in four days and still lacks review and authorization.",
    subject: "Harbor Works LLC · Q2 payroll filing",
    input: {
      client: "Harbor Works LLC",
      filing: "Q2 payroll filing",
      deadline_days: 4,
      checklist: [
        { label: "Payroll register reconciled", complete: true },
        { label: "Deposit totals verified", complete: true },
        { label: "State account notice attached", complete: false },
      ],
      reviewer_approved: false,
      authorization_received: false,
      payment_confirmed: true,
    },
  },
  {
    id: "cedar-family-review",
    label: "Ready except client authorization",
    summary: "Preparation and internal review are complete; one client signature remains.",
    subject: "Cedar Family Holdings · 2025 partnership return",
    input: {
      client: "Cedar Family Holdings",
      filing: "2025 partnership return",
      deadline_days: 16,
      checklist: [
        { label: "Trial balance reconciled", complete: true },
        { label: "Partner allocations reviewed", complete: true },
        { label: "Diagnostics cleared", complete: true },
      ],
      reviewer_approved: true,
      authorization_received: false,
      payment_confirmed: true,
    },
  },
  {
    id: "pine-street-ready",
    label: "Ready for human filing",
    summary: "All configured readiness gates are complete.",
    subject: "Pine Street Clinic · Sales tax filing",
    input: {
      client: "Pine Street Clinic",
      filing: "August sales tax filing",
      deadline_days: 12,
      checklist: [
        { label: "Sales report reconciled", complete: true },
        { label: "Exempt sales checked", complete: true },
        { label: "Prior balance reviewed", complete: true },
      ],
      reviewer_approved: true,
      authorization_received: true,
      payment_confirmed: true,
    },
  },
] satisfies readonly OperationalScenario<FilingReadinessInput>[];

export function analyzeAccountingFilingReadiness(input: FilingReadinessInput): OperationalOutput {
  const incomplete = input.checklist.filter((item) => !item.complete);
  const gates = [
    ...incomplete.map((item) => ({
      title: item.label,
      evidence: "Checklist item is incomplete.",
      action: "Complete and document this preparation check.",
    })),
    ...(!input.reviewer_approved
      ? [
          {
            title: "Reviewer approval",
            evidence: "No reviewer approval is recorded.",
            action: "Assign the package to the designated reviewer.",
          },
        ]
      : []),
    ...(!input.authorization_received
      ? [
          {
            title: "Client authorization",
            evidence: "Required authorization is not recorded.",
            action: "Confirm the correct authorization form and request human-approved follow-up.",
          },
        ]
      : []),
    ...(!input.payment_confirmed
      ? [
          {
            title: "Payment confirmation",
            evidence: "Payment instructions are not confirmed.",
            action: "A staff member must confirm payment handling.",
          },
        ]
      : []),
  ];
  const blocked = gates.length > 0;
  const priority = blocked && input.deadline_days <= 7 ? "high" : blocked ? "medium" : "low";

  return {
    headline: blocked
      ? `${gates.length} filing gate${gates.length === 1 ? "" : "s"} remain open`
      : "Package passed every configured readiness gate",
    summary: `${input.client}'s ${input.filing} is due in ${input.deadline_days} days. ${input.checklist.length - incomplete.length}/${input.checklist.length} preparation checks are complete.`,
    status: blocked ? "blocked" : "ready",
    priority,
    confidence: 1,
    signals: [
      {
        label: "Preparation",
        value: `${input.checklist.length - incomplete.length}/${input.checklist.length} complete`,
        tone: incomplete.length ? "watch" : "positive",
      },
      {
        label: "Reviewer",
        value: input.reviewer_approved ? "Approved" : "Missing",
        tone: input.reviewer_approved ? "positive" : "alert",
      },
      {
        label: "Authorization",
        value: input.authorization_received ? "Received" : "Missing",
        tone: input.authorization_received ? "positive" : "alert",
      },
      {
        label: "Deadline",
        value: `${input.deadline_days} days`,
        tone: input.deadline_days <= 7 ? "alert" : "neutral",
      },
    ],
    exceptions: gates.map((gate) => ({
      title: gate.title,
      evidence: gate.evidence,
      impact: "The package must not move to filing while this gate is open.",
      recommended_action: gate.action,
    })),
    checks: [
      {
        label: "Preparation checklist",
        status: incomplete.length ? "fail" : "pass",
        detail: `${incomplete.length} checklist item${incomplete.length === 1 ? "" : "s"} remain open.`,
      },
      {
        label: "Professional review",
        status: input.reviewer_approved ? "pass" : "fail",
        detail: input.reviewer_approved
          ? "Reviewer approval is recorded."
          : "Reviewer approval is absent.",
      },
      {
        label: "Client authorization",
        status: input.authorization_received ? "pass" : "fail",
        detail: input.authorization_received
          ? "Authorization is recorded."
          : "Authorization is absent.",
      },
      {
        label: "Payment gate",
        status: input.payment_confirmed ? "pass" : "review",
        detail: input.payment_confirmed
          ? "Payment handling is confirmed."
          : "Payment handling needs confirmation.",
      },
    ],
    recommended_action: blocked
      ? "Resolve every open gate and rerun the readiness check before a person files anything."
      : "A qualified professional may perform the final filing review and submit through the normal system.",
    draft_message: blocked
      ? `${input.filing} is not ready to file. Open gates: ${gates.map((gate) => gate.title).join(", ")}. No filing was submitted.`
      : `${input.filing} passed the configured readiness checks. Final filing authority remains with the designated professional.`,
  };
}

export function submitAccountingFilingReadiness(
  scenarioId: string,
  options: { client?: SupabaseClient; visitorSessionId: string },
) {
  const scenario = accountingFilingReadinessScenarios.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error("Unknown Filing Readiness scenario.");
  return runOperationalCase({
    agentId: accountingFilingReadinessAgent.id,
    scenario,
    analyze: analyzeAccountingFilingReadiness,
    ...options,
  });
}
