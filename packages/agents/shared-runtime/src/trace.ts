import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { activeFault } from "./fault";
import { redactForDisplay } from "./redact";

export type TraceContext = {
  client: SupabaseClient;
  runId: string;
  visitorSessionId: string | null;
};

type StartRunInput = {
  client: SupabaseClient;
  agent: "intake-brief" | "document-routing" | "stalled-work";
  subjectType: string;
  subjectId: string;
  model: string;
  visitorSessionId?: string | null;
};

type RecordStepInput = {
  trace: TraceContext;
  sequence: number;
  name: string;
  input: unknown;
  output: unknown;
  startedAt: string;
  finishedAt?: string;
  tokens?: number;
  note?: string;
};

function requireSuccess(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

export async function startRun(input: StartRunInput): Promise<TraceContext> {
  if (activeFault() === "db_flap") throw new Error("Injected database failure before run start.");
  const runId = randomUUID();
  const { error } = await input.client.from("agent_runs").insert({
    id: runId,
    agent: input.agent,
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    model: input.model,
    status: "running",
    visitor_session_id: input.visitorSessionId ?? null,
  });
  requireSuccess(error, "Could not start agent run");

  return {
    client: input.client,
    runId,
    visitorSessionId: input.visitorSessionId ?? null,
  };
}

export async function recordStep(input: RecordStepInput) {
  const finishedAt = input.finishedAt ?? new Date().toISOString();
  const { error } = await input.trace.client.from("agent_steps").insert({
    id: randomUUID(),
    run_id: input.trace.runId,
    seq: input.sequence,
    name: input.name,
    input_json: input.input,
    output_json: input.output,
    display_input_json: redactForDisplay(input.input),
    display_output_json: redactForDisplay(input.output),
    started_at: input.startedAt,
    finished_at: finishedAt,
    tokens: input.tokens ?? 0,
    note: input.note ?? null,
    visitor_session_id: input.trace.visitorSessionId,
  });
  requireSuccess(error, `Could not record ${input.name} trace step`);
}

export async function finishRun(
  trace: TraceContext,
  usage: { inputTokens: number; outputTokens: number },
) {
  const { error } = await trace.client
    .from("agent_runs")
    .update({
      status: "review",
      finished_at: new Date().toISOString(),
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      cost_usd: 0,
      error: null,
    })
    .eq("id", trace.runId);
  requireSuccess(error, "Could not finish agent run");
}

export async function failRun(trace: TraceContext, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown agent failure";
  const { error: updateError } = await trace.client
    .from("agent_runs")
    .update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error: message.slice(0, 500),
    })
    .eq("id", trace.runId);
  requireSuccess(updateError, "Could not mark agent run as failed");
}
