export type AgentQueueId = "intake-brief" | "document-routing" | "stalled-work";

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
