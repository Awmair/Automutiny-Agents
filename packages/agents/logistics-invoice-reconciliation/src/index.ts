import {
  defineAgent,
  type OperationalScenario,
  runOperationalCase,
} from "@automutiny/agent-runtime";
import type { OperationalOutput, SupabaseClient } from "@automutiny/db";

type Charge = { label: string; quoted: number; invoiced: number; approved: boolean };

export type InvoiceReconciliationInput = Record<string, unknown> & {
  load_id: string;
  carrier: string;
  invoice_id: string;
  linehaul_quoted: number;
  linehaul_invoiced: number;
  fuel_quoted: number;
  fuel_invoiced: number;
  accessorials: Charge[];
  pod_accepted: boolean;
};

export const logisticsInvoiceReconciliationAgent = defineAgent({
  id: "logistics-invoice-reconciliation",
  label: "Logistics Agent 3",
  name: "Invoice Reconciliation Agent",
  purpose: "Matches carrier charges to the agreed rate and supporting approvals.",
  humanBoundary:
    "A person confirms supporting evidence, disputes, deductions and payment approval.",
  route: "/logistics/invoice-reconciliation",
});

export const logisticsInvoiceReconciliationScenarios = [
  {
    id: "invoice-8821-variance",
    label: "Unapproved detention charge",
    summary: "The base rate matches, but a $375 detention line has no approval record.",
    subject: "Invoice INV-8821 · Load 4821",
    input: {
      load_id: "4821",
      carrier: "Mesa Linehaul",
      invoice_id: "INV-8821",
      linehaul_quoted: 2450,
      linehaul_invoiced: 2450,
      fuel_quoted: 410,
      fuel_invoiced: 410,
      accessorials: [{ label: "Detention", quoted: 0, invoiced: 375, approved: false }],
      pod_accepted: true,
    },
  },
  {
    id: "invoice-9104-rate-mismatch",
    label: "Linehaul rate mismatch",
    summary: "The invoice is $240 above the rate confirmation and the POD is not accepted.",
    subject: "Invoice INV-9104 · Load 5174",
    input: {
      load_id: "5174",
      carrier: "Blue Oak Transport",
      invoice_id: "INV-9104",
      linehaul_quoted: 1800,
      linehaul_invoiced: 2040,
      fuel_quoted: 320,
      fuel_invoiced: 320,
      accessorials: [],
      pod_accepted: false,
    },
  },
  {
    id: "invoice-9260-clean",
    label: "Clean carrier invoice",
    summary: "All invoice lines match the rate confirmation and supporting records.",
    subject: "Invoice INV-9260 · Load 5290",
    input: {
      load_id: "5290",
      carrier: "Summit West Freight",
      invoice_id: "INV-9260",
      linehaul_quoted: 1325,
      linehaul_invoiced: 1325,
      fuel_quoted: 265,
      fuel_invoiced: 265,
      accessorials: [{ label: "Lumper", quoted: 95, invoiced: 95, approved: true }],
      pod_accepted: true,
    },
  },
] satisfies readonly OperationalScenario<InvoiceReconciliationInput>[];

function money(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function analyzeLogisticsInvoice(input: InvoiceReconciliationInput): OperationalOutput {
  const linehaulVariance = input.linehaul_invoiced - input.linehaul_quoted;
  const fuelVariance = input.fuel_invoiced - input.fuel_quoted;
  const accessorialExceptions = input.accessorials.filter(
    (charge) => charge.invoiced !== charge.quoted || !charge.approved,
  );
  const totalQuoted =
    input.linehaul_quoted +
    input.fuel_quoted +
    input.accessorials.reduce((sum, charge) => sum + charge.quoted, 0);
  const totalInvoiced =
    input.linehaul_invoiced +
    input.fuel_invoiced +
    input.accessorials.reduce((sum, charge) => sum + charge.invoiced, 0);
  const totalVariance = totalInvoiced - totalQuoted;
  const exceptions = [
    ...(linehaulVariance !== 0
      ? [
          {
            title: "Linehaul variance",
            evidence: `Quoted ${money(input.linehaul_quoted)}; invoiced ${money(input.linehaul_invoiced)}.`,
            impact: `${money(Math.abs(linehaulVariance))} difference from the confirmed base rate.`,
            action: "Compare the invoice with the signed rate confirmation.",
          },
        ]
      : []),
    ...(fuelVariance !== 0
      ? [
          {
            title: "Fuel variance",
            evidence: `Quoted ${money(input.fuel_quoted)}; invoiced ${money(input.fuel_invoiced)}.`,
            impact: `${money(Math.abs(fuelVariance))} difference from the confirmed fuel charge.`,
            action: "Verify the fuel schedule used for the load.",
          },
        ]
      : []),
    ...accessorialExceptions.map((charge) => ({
      title: charge.label,
      evidence: `Quoted ${money(charge.quoted)}; invoiced ${money(charge.invoiced)}; approval ${charge.approved ? "present" : "missing"}.`,
      impact: `${money(Math.abs(charge.invoiced - charge.quoted))} charge variance or missing approval.`,
      action: "Verify the receipt and written accessorial approval.",
    })),
    ...(!input.pod_accepted
      ? [
          {
            title: "POD acceptance",
            evidence: "The matched load has no accepted POD.",
            impact: "The invoice lacks a required billing support gate.",
            action: "Complete human POD review before payment approval.",
          },
        ]
      : []),
  ];
  const priority =
    Math.abs(totalVariance) >= 250 || !input.pod_accepted
      ? "high"
      : exceptions.length
        ? "medium"
        : "low";

  return {
    headline: exceptions.length
      ? `${exceptions.length} invoice exception${exceptions.length === 1 ? " needs" : "s need"} AP review`
      : "Carrier invoice matches the configured payment controls",
    summary: `${input.invoice_id} totals ${money(totalInvoiced)} against ${money(totalQuoted)} in confirmed charges, a ${money(totalVariance)} variance.`,
    status: exceptions.length ? "blocked" : "ready",
    priority,
    confidence: 1,
    signals: [
      { label: "Quoted total", value: money(totalQuoted), tone: "neutral" },
      { label: "Invoice total", value: money(totalInvoiced), tone: "neutral" },
      {
        label: "Variance",
        value: money(totalVariance),
        tone: totalVariance === 0 ? "positive" : Math.abs(totalVariance) >= 250 ? "alert" : "watch",
      },
      {
        label: "POD",
        value: input.pod_accepted ? "Accepted" : "Not accepted",
        tone: input.pod_accepted ? "positive" : "alert",
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
        label: "Base rate",
        status: linehaulVariance === 0 ? "pass" : "fail",
        detail:
          linehaulVariance === 0
            ? "Linehaul matches the rate confirmation."
            : `${money(linehaulVariance)} variance found.`,
      },
      {
        label: "Fuel charge",
        status: fuelVariance === 0 ? "pass" : "review",
        detail:
          fuelVariance === 0
            ? "Fuel matches the agreed amount."
            : `${money(fuelVariance)} variance found.`,
      },
      {
        label: "Accessorial approval",
        status: accessorialExceptions.length ? "fail" : "pass",
        detail: `${accessorialExceptions.length} accessorial exception${accessorialExceptions.length === 1 ? "" : "s"} found.`,
      },
      {
        label: "POD gate",
        status: input.pod_accepted ? "pass" : "fail",
        detail: input.pod_accepted ? "Accepted POD is recorded." : "Accepted POD is missing.",
      },
    ],
    recommended_action: exceptions.length
      ? "AP should verify the flagged evidence and choose whether to approve, hold or dispute the invoice."
      : "AP may perform the final payment approval through the normal accounting system.",
    draft_message: exceptions.length
      ? `Hold ${input.invoice_id} for review. Exceptions: ${exceptions.map((item) => item.title).join(", ")}. No payment was approved.`
      : `${input.invoice_id} passed the configured reconciliation checks. Final payment approval remains human.`,
  };
}

export function submitLogisticsInvoiceReconciliation(
  scenarioId: string,
  options: { client?: SupabaseClient; visitorSessionId: string },
) {
  const scenario = logisticsInvoiceReconciliationScenarios.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error("Unknown Invoice Reconciliation scenario.");
  return runOperationalCase({
    agentId: logisticsInvoiceReconciliationAgent.id,
    scenario,
    analyze: analyzeLogisticsInvoice,
    ...options,
  });
}
