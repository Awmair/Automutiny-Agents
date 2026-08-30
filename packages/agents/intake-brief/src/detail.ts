import { createServerDatabaseClient } from "@automutiny/db";
import type { SupabaseClient } from "@supabase/supabase-js";

import { QualificationSchema } from "./schemas";
import type { IntakeReviewDetail, JsonRecord } from "./types";

type BriefRow = {
  id: string;
  lead_id: string;
  run_id: string;
  qualification_json: JsonRecord;
  brief_md: string;
  next_action: string;
  reply_draft: string;
  confidence: number;
  status: string;
  visitor_session_id: string | null;
  created_at: string;
};

type LeadRow = {
  id: string;
  contact_id: string | null;
  raw_json: JsonRecord;
};

type RunRow = {
  model: string;
  status: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  started_at: string;
  finished_at: string | null;
};

type StepRow = {
  seq: number;
  name: string;
  display_input_json: unknown;
  display_output_json: unknown;
  tokens: number;
  note: string | null;
  started_at: string;
  finished_at: string | null;
};

function strings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export async function getIntakeReviewDetail(
  briefId: string,
  client: SupabaseClient = createServerDatabaseClient(),
): Promise<IntakeReviewDetail | null> {
  const briefResult = await client
    .from("briefs")
    .select(
      "id, lead_id, run_id, qualification_json, brief_md, next_action, reply_draft, confidence, status, visitor_session_id, created_at",
    )
    .eq("id", briefId)
    .maybeSingle();
  if (briefResult.error)
    throw new Error(`Could not load intake brief: ${briefResult.error.message}`);
  if (!briefResult.data) return null;
  const brief = briefResult.data as BriefRow;

  const [leadResult, runResult, stepsResult] = await Promise.all([
    client.from("leads").select("id, contact_id, raw_json").eq("id", brief.lead_id).single(),
    client
      .from("agent_runs")
      .select("model, status, input_tokens, output_tokens, cost_usd, started_at, finished_at")
      .eq("id", brief.run_id)
      .single(),
    client
      .from("agent_steps")
      .select(
        "seq, name, display_input_json, display_output_json, tokens, note, started_at, finished_at",
      )
      .eq("run_id", brief.run_id)
      .order("seq", { ascending: true }),
  ]);
  if (leadResult.error) throw new Error(`Could not load intake lead: ${leadResult.error.message}`);
  if (runResult.error) throw new Error(`Could not load intake run: ${runResult.error.message}`);
  if (stepsResult.error)
    throw new Error(`Could not load intake trace: ${stepsResult.error.message}`);
  const lead = leadResult.data as LeadRow;
  const run = runResult.data as RunRow;
  const envelope = brief.qualification_json;
  const rawQualification =
    envelope.qualification && typeof envelope.qualification === "object"
      ? (envelope.qualification as JsonRecord)
      : envelope;
  const parsedQualification = QualificationSchema.safeParse(rawQualification);

  let email = text(lead.raw_json.email, "") || null;
  let subject = text(lead.raw_json.name, "Unnamed inquiry");
  if (lead.contact_id) {
    const contactResult = await client
      .from("contacts")
      .select("name, email")
      .eq("id", lead.contact_id)
      .maybeSingle();
    if (contactResult.error)
      throw new Error(`Could not load intake contact: ${contactResult.error.message}`);
    if (contactResult.data) {
      subject = text(contactResult.data.name, subject);
      email = text(contactResult.data.email, email ?? "") || null;
    }
  }

  return {
    briefId: brief.id,
    leadId: brief.lead_id,
    runId: brief.run_id,
    visitorSessionId: brief.visitor_session_id,
    subject,
    email,
    submitted: lead.raw_json,
    qualification: parsedQualification.success ? parsedQualification.data : null,
    qualificationRaw: rawQualification,
    briefMd: brief.brief_md,
    nextAction: brief.next_action,
    nextActionReason: text(envelope.next_action_reason, "Prepared for human review."),
    replyDraft: brief.reply_draft,
    questionsForCall: strings(envelope.questions_for_call),
    confidence: Number(brief.confidence),
    needsHumanContext: envelope.needs_human_context === true,
    status: brief.status,
    createdAt: brief.created_at,
    run: {
      model: run.model,
      status: run.status,
      inputTokens: run.input_tokens,
      outputTokens: run.output_tokens,
      costUsd: Number(run.cost_usd),
      startedAt: run.started_at,
      finishedAt: run.finished_at,
    },
    steps: ((stepsResult.data ?? []) as StepRow[]).map((step) => ({
      sequence: step.seq,
      name: step.name,
      input: step.display_input_json,
      output: step.display_output_json,
      tokens: step.tokens,
      note: step.note,
      startedAt: step.started_at,
      finishedAt: step.finished_at,
    })),
  };
}
