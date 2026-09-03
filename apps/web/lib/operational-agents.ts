import {
  accountingDocumentChaseAgent,
  accountingDocumentChaseWorkflow,
  submitAccountingDocumentChase,
} from "@automutiny/accounting-document-chase-agent";
import {
  accountingFilingReadinessAgent,
  accountingFilingReadinessWorkflow,
  submitAccountingFilingReadiness,
} from "@automutiny/accounting-filing-readiness-agent";
import {
  accountingTransactionReviewAgent,
  accountingTransactionReviewWorkflow,
  submitAccountingTransactionReview,
} from "@automutiny/accounting-transaction-review-agent";
import type { AgentDefinition } from "@automutiny/agent-runtime";
import type { OperationalAgentId, SupabaseClient } from "@automutiny/db";
import {
  logisticsInvoiceReconciliationAgent,
  logisticsInvoiceReconciliationWorkflow,
  submitLogisticsInvoiceReconciliation,
} from "@automutiny/logistics-invoice-reconciliation-agent";
import {
  logisticsLoadExceptionAgent,
  logisticsLoadExceptionWorkflow,
  submitLogisticsLoadException,
} from "@automutiny/logistics-load-exception-agent";
import {
  logisticsPodVerificationAgent,
  logisticsPodVerificationWorkflow,
  submitLogisticsPodVerification,
} from "@automutiny/logistics-pod-verification-agent";

export const accountingAgents = [
  accountingDocumentChaseAgent,
  accountingTransactionReviewAgent,
  accountingFilingReadinessAgent,
] as const;

export const logisticsAgents = [
  logisticsLoadExceptionAgent,
  logisticsPodVerificationAgent,
  logisticsInvoiceReconciliationAgent,
] as const;

export const operationalAgents = [...accountingAgents, ...logisticsAgents] as const;

type OperationalWorkflow = {
  heading: string;
  intro: string;
  businessFlow: readonly (readonly [string, string])[];
  technicalFlow: readonly (readonly [string, string])[];
  usesModel: boolean;
};

export const operationalWorkflows = new Map<string, OperationalWorkflow>([
  [accountingDocumentChaseAgent.id, accountingDocumentChaseWorkflow],
  [accountingTransactionReviewAgent.id, accountingTransactionReviewWorkflow],
  [accountingFilingReadinessAgent.id, accountingFilingReadinessWorkflow],
  [logisticsLoadExceptionAgent.id, logisticsLoadExceptionWorkflow],
  [logisticsPodVerificationAgent.id, logisticsPodVerificationWorkflow],
  [logisticsInvoiceReconciliationAgent.id, logisticsInvoiceReconciliationWorkflow],
]);

export function operationalAgentById(agentId: string): AgentDefinition | null {
  return operationalAgents.find((agent) => agent.id === agentId) ?? null;
}

export function operationalAgentByRoute(vertical: "accounting" | "logistics", slug: string) {
  const agents = vertical === "accounting" ? accountingAgents : logisticsAgents;
  return agents.find((agent) => agent.route === `/${vertical}/${slug}`) ?? null;
}

export function submitOperationalAgent(
  agentId: OperationalAgentId,
  scenarioId: string,
  options: { client: SupabaseClient; visitorSessionId: string },
) {
  switch (agentId) {
    case "accounting-document-chase":
      return submitAccountingDocumentChase(scenarioId, options);
    case "accounting-transaction-review":
      return submitAccountingTransactionReview(scenarioId, options);
    case "accounting-filing-readiness":
      return submitAccountingFilingReadiness(scenarioId, options);
    case "logistics-load-exception":
      return submitLogisticsLoadException(scenarioId, options);
    case "logistics-pod-verification":
      return submitLogisticsPodVerification(scenarioId, options);
    case "logistics-invoice-reconciliation":
      return submitLogisticsInvoiceReconciliation(scenarioId, options);
  }
}
