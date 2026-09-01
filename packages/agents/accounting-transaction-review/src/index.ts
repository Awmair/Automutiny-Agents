import {
  defineAgent,
  type OperationalScenario,
  runOperationalCase,
} from "@automutiny/agent-runtime";
import type { OperationalOutput, SupabaseClient } from "@automutiny/db";

type Transaction = {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  duplicate_of: string | null;
  vendor_known: boolean;
};

export type TransactionReviewInput = Record<string, unknown> & {
  client: string;
  period: string;
  transactions: Transaction[];
};

export const accountingTransactionReviewAgent = defineAgent({
  id: "accounting-transaction-review",
  label: "Accounting Agent 2",
  name: "Transaction Review Agent",
  purpose: "Surfaces ledger exceptions and prepares evidence-backed coding suggestions.",
  humanBoundary: "A person confirms the vendor, accounting treatment and any ledger posting.",
  route: "/accounting/transaction-review",
});

export const accountingTransactionReviewScenarios = [
  {
    id: "riverbend-august",
    label: "Duplicate and unknown vendor",
    summary: "One apparent duplicate and one high-value uncategorized payment need review.",
    subject: "Riverbend Retail · August transaction review",
    input: {
      client: "Riverbend Retail",
      period: "August 2026",
      transactions: [
        {
          id: "TX-104",
          description: "Harbor Supply",
          amount: 2480,
          category: "Supplies",
          duplicate_of: null,
          vendor_known: true,
        },
        {
          id: "TX-105",
          description: "Harbor Supply",
          amount: 2480,
          category: "Supplies",
          duplicate_of: "TX-104",
          vendor_known: true,
        },
        {
          id: "TX-106",
          description: "Aster Services",
          amount: 12750,
          category: null,
          duplicate_of: null,
          vendor_known: false,
        },
        {
          id: "TX-107",
          description: "City Utilities",
          amount: 891,
          category: "Utilities",
          duplicate_of: null,
          vendor_known: true,
        },
      ],
    },
  },
  {
    id: "north-coast-clean",
    label: "Clean monthly batch",
    summary: "All vendors are known, transactions are categorized, and no duplicate is present.",
    subject: "North Coast Studio · August transaction review",
    input: {
      client: "North Coast Studio",
      period: "August 2026",
      transactions: [
        {
          id: "TX-201",
          description: "Office Lease",
          amount: 4200,
          category: "Rent",
          duplicate_of: null,
          vendor_known: true,
        },
        {
          id: "TX-202",
          description: "Cloud Hosting",
          amount: 640,
          category: "Software",
          duplicate_of: null,
          vendor_known: true,
        },
        {
          id: "TX-203",
          description: "Payroll Funding",
          amount: 9400,
          category: "Payroll",
          duplicate_of: null,
          vendor_known: true,
        },
      ],
    },
  },
  {
    id: "summit-field-expenses",
    label: "Uncategorized expense batch",
    summary: "Three smaller expenses have no category and need client context.",
    subject: "Summit Field Services · Expense review",
    input: {
      client: "Summit Field Services",
      period: "August 2026",
      transactions: [
        {
          id: "TX-301",
          description: "Roadside Market",
          amount: 186,
          category: null,
          duplicate_of: null,
          vendor_known: false,
        },
        {
          id: "TX-302",
          description: "Metro Parking",
          amount: 72,
          category: null,
          duplicate_of: null,
          vendor_known: false,
        },
        {
          id: "TX-303",
          description: "Cedar Hardware",
          amount: 415,
          category: null,
          duplicate_of: null,
          vendor_known: true,
        },
      ],
    },
  },
] satisfies readonly OperationalScenario<TransactionReviewInput>[];

export function analyzeAccountingTransactions(input: TransactionReviewInput): OperationalOutput {
  const duplicates = input.transactions.filter((transaction) => transaction.duplicate_of);
  const uncategorized = input.transactions.filter((transaction) => !transaction.category);
  const unknownHighValue = input.transactions.filter(
    (transaction) => !transaction.vendor_known && transaction.amount >= 10_000,
  );
  const exceptionIds = new Set([
    ...duplicates.map((transaction) => transaction.id),
    ...uncategorized.map((transaction) => transaction.id),
    ...unknownHighValue.map((transaction) => transaction.id),
  ]);
  const exceptions = input.transactions.filter((transaction) => exceptionIds.has(transaction.id));
  const priority =
    unknownHighValue.length || duplicates.length ? "high" : exceptions.length ? "medium" : "low";

  return {
    headline: exceptions.length
      ? `${exceptions.length} transaction${exceptions.length === 1 ? "" : "s"} need accountant review`
      : "Transaction batch passed the configured exception checks",
    summary: `${input.client}'s ${input.period} batch contains ${input.transactions.length} transactions, ${duplicates.length} duplicate flag${duplicates.length === 1 ? "" : "s"}, and ${uncategorized.length} uncategorized item${uncategorized.length === 1 ? "" : "s"}.`,
    status: exceptions.length ? "needs_review" : "ready",
    priority,
    confidence: 0.98,
    signals: [
      { label: "Batch size", value: String(input.transactions.length), tone: "neutral" },
      {
        label: "Duplicates",
        value: String(duplicates.length),
        tone: duplicates.length ? "alert" : "positive",
      },
      {
        label: "Uncategorized",
        value: String(uncategorized.length),
        tone: uncategorized.length ? "watch" : "positive",
      },
      {
        label: "High-value unknown",
        value: String(unknownHighValue.length),
        tone: unknownHighValue.length ? "alert" : "positive",
      },
    ],
    exceptions: exceptions.map((transaction) => ({
      title: `${transaction.id} · ${transaction.description}`,
      evidence: `$${transaction.amount.toLocaleString("en-US")} · ${transaction.category ?? "No category"}${transaction.duplicate_of ? ` · matches ${transaction.duplicate_of}` : ""}`,
      impact: transaction.duplicate_of
        ? "Posting both entries may overstate the expense."
        : "The transaction cannot be posted confidently without accounting context.",
      recommended_action: transaction.duplicate_of
        ? `Compare the source document with ${transaction.duplicate_of} before posting.`
        : "Confirm the vendor purpose and accounting category before posting.",
    })),
    checks: [
      {
        label: "Duplicate scan",
        status: duplicates.length ? "review" : "pass",
        detail: `${duplicates.length} transaction${duplicates.length === 1 ? "" : "s"} matched another entry.`,
      },
      {
        label: "Category coverage",
        status: uncategorized.length ? "review" : "pass",
        detail: `${input.transactions.length - uncategorized.length}/${input.transactions.length} entries have a category.`,
      },
      {
        label: "High-value vendor check",
        status: unknownHighValue.length ? "fail" : "pass",
        detail: `${unknownHighValue.length} unknown vendor payment${unknownHighValue.length === 1 ? "" : "s"} crossed $10,000.`,
      },
    ],
    recommended_action: exceptions.length
      ? "Review only the flagged transactions, attach source evidence, and approve any ledger change manually."
      : "A staff member can approve the batch for the normal posting workflow.",
    draft_message: exceptions.length
      ? `Review ${exceptions.map((transaction) => transaction.id).join(", ")} before posting. The agent found duplicate, category, or vendor exceptions and made no ledger changes.`
      : `${input.client}'s ${input.period} transaction batch passed the configured checks. No ledger changes were made.`,
  };
}

export function submitAccountingTransactionReview(
  scenarioId: string,
  options: { client?: SupabaseClient; visitorSessionId: string },
) {
  const scenario = accountingTransactionReviewScenarios.find((item) => item.id === scenarioId);
  if (!scenario) throw new Error("Unknown Transaction Review scenario.");
  return runOperationalCase({
    agentId: accountingTransactionReviewAgent.id,
    scenario,
    analyze: analyzeAccountingTransactions,
    ...options,
  });
}
