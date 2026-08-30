import type { IntakeBrief, Qualification } from "./schemas";

export type JsonRecord = Record<string, unknown>;

export type IntakeLead = {
  id: string;
  firm_id: string;
  contact_id: string | null;
  source: string;
  raw_json: JsonRecord;
  practice_area_guess: string | null;
  status: string;
  visitor_session_id: string | null;
  created_at: string;
};

export type IntakeContact = {
  id: string;
  firm_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  notes: string | null;
  visitor_session_id: string | null;
};

export type IntakeInteraction = {
  channel: string;
  direction: string;
  occurred_at: string;
  summary: string;
};

export type IntakeMatter = {
  id: string;
  matter_type: string;
  stage: string;
  opened_at: string;
  status: string;
  last_client_contact_at: string | null;
};

export type ContactMatch = {
  contact: IntakeContact | null;
  basis: "linked_contact" | "exact_email" | "exact_phone" | "similar_name" | "ambiguous" | "none";
  candidateIds: string[];
};

export type ContextBundle = {
  lead: IntakeLead;
  contact: IntakeContact | null;
  contactMatch: Omit<ContactMatch, "contact">;
  interactions: IntakeInteraction[];
  matters: IntakeMatter[];
  companyLookup: {
    company: string;
    status: "not_configured" | "lookup_unavailable";
  } | null;
};

export type GuardOutcome = {
  brief: IntakeBrief;
  needsHumanContext: boolean;
  checks: string[];
};

export type RunIntakeResult = {
  runId: string;
  briefId: string | null;
  status: "running" | "review";
  reused: boolean;
  qualification: Qualification | null;
  brief: IntakeBrief | null;
};

export type IntakeTraceStep = {
  sequence: number;
  name: string;
  input: unknown;
  output: unknown;
  tokens: number;
  note: string | null;
  startedAt: string;
  finishedAt: string | null;
};

export type IntakeReviewDetail = {
  briefId: string;
  leadId: string;
  runId: string;
  visitorSessionId: string | null;
  subject: string;
  email: string | null;
  submitted: JsonRecord;
  qualification: Qualification | null;
  qualificationRaw: JsonRecord;
  briefMd: string;
  nextAction: string;
  nextActionReason: string;
  replyDraft: string;
  questionsForCall: string[];
  confidence: number;
  needsHumanContext: boolean;
  status: string;
  createdAt: string;
  run: {
    model: string;
    status: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    startedAt: string;
    finishedAt: string | null;
  };
  steps: IntakeTraceStep[];
};
