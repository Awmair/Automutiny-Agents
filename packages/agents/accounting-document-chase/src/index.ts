import {
  defineAgent,
  type OperationalScenario,
  runOperationalCase,
} from "@automutiny/agent-runtime";
import type { OperationalOutput, SupabaseClient } from "@automutiny/db";

export { accountingDocumentChaseWorkflow } from "./workflow";

export type DocumentChaseInput = Record<string, unknown> & {
  client: string;
  engagement: string;
  deadline_days: number;
  documents: Array<{ name: string; status: "received" | "missing"; requested_days_ago: number }>;
};

export const accountingDocumentChaseAgent = defineAgent({
  id: "accounting-document-chase",
  label: "Accounting Agent 1",
  name: "Client Document Chase Agent",
  purpose: "Finds missing client records and prepares one deadline-aware follow-up.",
  humanBoundary: "A person confirms the request, client communication and any filing decision.",
  route: "/accounting/document-chase",
});

export const accountingDocumentChaseScenarios = [
  {
    id: "mesa-dental-return",
    label: "Urgent business return",
    summary: "Two records are still missing nine days before the target filing date.",
    subject: "Mesa Dental Group · 2025 business return",
    input: {
      client: "Mesa Dental Group",
      engagement: "2025 business return",
      deadline_days: 9,
      documents: [
        { name: "December bank statement", status: "missing", requested_days_ago: 11 },
        { name: "Year-end payroll summary", status: "missing", requested_days_ago: 8 },
        { name: "Fixed asset schedule", status: "received", requested_days_ago: 6 },
      ],
    },
  },
  {
    id: "ardent-design-return",
    label: "One missing tax form",
    summary: "A brokerage form is outstanding with enough time for a normal follow-up.",
    subject: "Ardent Design Studio · 2025 individual return",
    input: {
      client: "Ardent Design Studio",
      engagement: "2025 individual return",
      deadline_days: 25,
      documents: [
        { name: "Brokerage 1099", status: "missing", requested_days_ago: 5 },
        { name: "W-2", status: "received", requested_days_ago: 12 },
        { name: "Mortgage interest statement", status: "received", requested_days_ago: 12 },
      ],
    },
  },
  {
    id: "lumen-close-ready",
    label: "Complete client file",
    summary: "Every requested record is present and the file can move to preparation review.",
    subject: "Lumen Foods · August close",
    input: {
      client: "Lumen Foods",
      engagement: "August monthly close",
      deadline_days: 18,
      documents: [
        { name: "Bank statements", status: "received", requested_days_ago: 3 },
        { name: "Credit card statements", status: "received", requested_days_ago: 3 },
        { name: "Payroll register", status: "received", requested_days_ago: 3 },
      ],
    },
  },
] satisfies readonly OperationalScenario<DocumentChaseInput>[];

export function analyzeAccountingDocumentChase(input: DocumentChaseInput): OperationalOutput {
  const missing = input.documents.filter((document) => document.status === "missing");
  const oldestRequest = Math.max(0, ...missing.map((document) => document.requested_days_ago));
  const priority = missing.length === 0 ? "low" : input.deadline_days <= 10 ? "high" : "medium";
  const status =
    missing.length === 0 ? "ready" : input.deadline_days <= 5 ? "blocked" : "needs_review";
  const names = missing.map((document) => document.name).join(", ");

  return {
    headline: missing.length
      ? `${missing.length} missing document${missing.length === 1 ? "" : "s"} need follow-up`
      : "Client file is complete for preparation review",
    summary: missing.length
      ? `${input.client} is missing ${names}. The target date is ${input.deadline_days} days away.`
      : `${input.client} has supplied every record in the current checklist.`,
    status,
    priority,
    confidence: 0.99,
    signals: [
      {
        label: "Documents",
        value: `${input.documents.length - missing.length}/${input.documents.length} received`,
        tone: missing.length ? "watch" : "positive",
      },
      {
        label: "Target date",
        value: `${input.deadline_days} days`,
        tone: input.deadline_days <= 10 ? "alert" : "neutral",
      },
      {
        label: "Oldest request",
        value: missing.length ? `${oldestRequest} days` : "No open request",
        tone: oldestRequest >= 7 ? "watch" : "positive",
      },
    ],
    exceptions: missing.map((document) => ({
      title: document.name,
      evidence: `Marked missing after a request ${document.requested_days_ago} days ago.`,
      impact: `The ${input.engagement} cannot be treated as ready until the record is reviewed.`,
      recommended_action: `Confirm the item is still required, then include it in the prepared client follow-up.`,
    })),
    checks: [
      {
        label: "Checklist comparison",
        status: missing.length ? "review" : "pass",
        detail: `${missing.length} required item${missing.length === 1 ? "" : "s"} remain open.`,
      },
      {
        label: "Deadline risk",
        status: input.deadline_days <= 5 ? "fail" : input.deadline_days <= 10 ? "review" : "pass",
        detail: `${input.deadline_days} days remain before the target date.`,
      },
      {
        label: "Duplicate requests",
        status: "pass",
        detail: "One consolidated follow-up was prepared.",
      },
    ],
    recommended_action: missing.length
      ? "Review the consolidated request and send it through the firm's normal client channel."
      : "Move the file to preparation review after a staff member confirms completeness.",
    draft_message: missing.length
      ? `Hi ${input.client}, we are still waiting for the following items for ${input.engagement}: ${names}. Please send them when available. A member of the firm will confirm timing and next steps.`
      : `${input.client}'s current checklist is complete. A staff member should confirm the file before preparation begins.`,
  };
}

export function submitAccountingDocumentChase(
  scenarioId: string,
  options: { client?: SupabaseClient; visitorSessionId: string },
) {
  const scenario = accountingDocumentChaseScenarios.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error("Unknown Client Document Chase scenario.");
  return runOperationalCase({
    agentId: accountingDocumentChaseAgent.id,
    scenario,
    analyze: analyzeAccountingDocumentChase,
    ...options,
  });
}
