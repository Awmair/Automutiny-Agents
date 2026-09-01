export const operationalAgentIds = [
  "accounting-document-chase",
  "accounting-transaction-review",
  "accounting-filing-readiness",
  "logistics-load-exception",
  "logistics-pod-verification",
  "logistics-invoice-reconciliation",
] as const;

export type OperationalAgentId = (typeof operationalAgentIds)[number];

export type AgentQueueId =
  | "intake-brief"
  | "document-routing"
  | "stalled-work"
  | OperationalAgentId;

export type AgentQueueItem = {
  id: string;
  subject: string;
  summary: string;
  confidence: number | null;
  createdAt: string;
  status: string;
  href: string | null;
};

export type AgentQueue = {
  agentId: AgentQueueId;
  items: AgentQueueItem[];
  awaitingReview: number;
};

export type AgentQueueSummary = {
  agentId: AgentQueueId;
  total: number;
  awaitingReview: number;
};

export type OperationalSignal = {
  label: string;
  value: string;
  tone: "positive" | "watch" | "alert" | "neutral";
};

export type OperationalException = {
  title: string;
  evidence: string;
  impact: string;
  recommended_action: string;
};

export type OperationalCheck = {
  label: string;
  status: "pass" | "review" | "fail";
  detail: string;
};

export type OperationalOutput = {
  headline: string;
  summary: string;
  status: "ready" | "needs_review" | "blocked";
  priority: "low" | "medium" | "high";
  confidence: number;
  signals: OperationalSignal[];
  exceptions: OperationalException[];
  checks: OperationalCheck[];
  recommended_action: string;
  draft_message: string;
};

export type OperationalCaseDetail = {
  id: string;
  agentId: OperationalAgentId;
  scenarioId: string;
  subject: string;
  input: Record<string, unknown>;
  output: OperationalOutput;
  status: string;
  visitorSessionId: string | null;
  createdAt: string;
  run: {
    id: string;
    model: string;
    status: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    startedAt: string;
    finishedAt: string | null;
  };
  steps: Array<{
    sequence: number;
    name: string;
    input: unknown;
    output: unknown;
    tokens: number;
    note: string | null;
  }>;
};
