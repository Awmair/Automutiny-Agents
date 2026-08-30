import { randomUUID } from "node:crypto";
import {
  callStructured,
  defaultGroqModel,
  failRun,
  finishRun,
  recordStep,
  startRun,
} from "@automutiny/agent-runtime";
import { createServerDatabaseClient } from "@automutiny/db";
import type { SupabaseClient } from "@supabase/supabase-js";

import { gatherContext } from "./context";
import { guardIntakeOutput } from "./guard";
import { loadIntake } from "./load";
import { briefPrompt, qualificationPrompt } from "./prompts";
import { BriefSchema, type IntakeBrief, type Qualification, QualificationSchema } from "./schemas";
import type { RunIntakeResult } from "./types";

type RunIntakeOptions = {
  client?: SupabaseClient;
  model?: string;
};

type ExistingRun = {
  id: string;
  status: "running" | "review";
};

type ExistingBrief = {
  id: string;
  qualification_json: Record<string, unknown>;
  brief_md: string;
  next_action: IntakeBrief["next_action"];
  reply_draft: string;
  confidence: number;
};

async function existingResult(
  client: SupabaseClient,
  leadId: string,
): Promise<RunIntakeResult | null> {
  const runResult = await client
    .from("agent_runs")
    .select("id, status")
    .eq("agent", "intake-brief")
    .eq("subject_type", "lead")
    .eq("subject_id", leadId)
    .in("status", ["running", "review"])
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (runResult.error)
    throw new Error(`Could not check existing intake run: ${runResult.error.message}`);
  if (!runResult.data) return null;

  const run = runResult.data as ExistingRun;
  const briefResult = await client
    .from("briefs")
    .select("id, qualification_json, brief_md, next_action, reply_draft, confidence")
    .eq("run_id", run.id)
    .maybeSingle();
  if (briefResult.error)
    throw new Error(`Could not load existing intake brief: ${briefResult.error.message}`);
  const stored = briefResult.data as ExistingBrief | null;
  const qualificationResult = stored
    ? QualificationSchema.safeParse(
        stored.qualification_json.qualification ?? stored.qualification_json,
      )
    : null;
  const briefResultValue = stored
    ? BriefSchema.safeParse({
        brief_md: stored.brief_md,
        next_action: stored.next_action,
        next_action_reason: stored.qualification_json.next_action_reason,
        reply_draft: stored.reply_draft,
        questions_for_call: stored.qualification_json.questions_for_call,
        confidence: stored.confidence,
      })
    : null;

  return {
    runId: run.id,
    briefId: stored?.id ?? null,
    status: run.status,
    reused: true,
    qualification: qualificationResult?.success ? qualificationResult.data : null,
    brief: briefResultValue?.success ? briefResultValue.data : null,
  };
}

export async function runIntake(
  leadId: string,
  options: RunIntakeOptions = {},
): Promise<RunIntakeResult> {
  const client = options.client ?? createServerDatabaseClient();
  const existing = await existingResult(client, leadId);
  if (existing) return existing;

  const loaded = await loadIntake(client, leadId);
  const model = options.model ?? process.env.MODEL_ID ?? defaultGroqModel;
  const trace = await startRun({
    client,
    agent: "intake-brief",
    subjectType: "lead",
    subjectId: leadId,
    model,
    visitorSessionId: loaded.lead.visitor_session_id,
  });

  try {
    const runningResult = await client.from("leads").update({ status: "running" }).eq("id", leadId);
    if (runningResult.error)
      throw new Error(`Could not mark lead as running: ${runningResult.error.message}`);

    await recordStep({
      trace,
      sequence: 1,
      name: "load",
      input: { leadId },
      output: { lead: loaded.lead, rulesCharacters: loaded.rules.length },
      startedAt: new Date().toISOString(),
      note: "Loaded lead and trusted firm intake rules",
    });

    const context = await gatherContext(client, loaded.lead);
    await recordStep({
      trace,
      sequence: 2,
      name: "gather-context",
      input: { leadId, linkedContactId: loaded.lead.contact_id },
      output: context,
      startedAt: new Date().toISOString(),
      note: "Matched firm context without merging ambiguous identities",
    });

    const qualificationMessages = qualificationPrompt(loaded, context);
    const qualificationCall = await callStructured({
      trace,
      sequence: 3,
      step: "qualify",
      schema: QualificationSchema,
      system: qualificationMessages.system,
      user: qualificationMessages.user,
      model,
      maxOutputTokens: 700,
    });
    const qualification: Qualification = qualificationCall.value;

    const briefMessages = briefPrompt(context, qualification);
    const briefCall = await callStructured({
      trace,
      sequence: 4,
      step: "draft",
      schema: BriefSchema,
      system: briefMessages.system,
      user: briefMessages.user,
      model,
      maxOutputTokens: 700,
    });
    const guard = guardIntakeOutput(qualification, briefCall.value);
    await recordStep({
      trace,
      sequence: 5,
      name: "guard",
      input: { qualification, draft: briefCall.value },
      output: guard,
      startedAt: new Date().toISOString(),
      note: guard.checks.join(" · "),
    });

    const briefId = randomUUID();
    const confidence = Math.min(qualification.confidence, guard.brief.confidence);
    const saveResult = await client.from("briefs").insert({
      id: briefId,
      lead_id: leadId,
      run_id: trace.runId,
      qualification_json: {
        qualification,
        next_action_reason: guard.brief.next_action_reason,
        questions_for_call: guard.brief.questions_for_call,
        needs_human_context: guard.needsHumanContext,
        guard_checks: guard.checks,
      },
      brief_md: guard.brief.brief_md,
      next_action: guard.brief.next_action,
      reply_draft: guard.brief.reply_draft,
      confidence,
      status: "review",
      visitor_session_id: loaded.lead.visitor_session_id,
    });
    if (saveResult.error)
      throw new Error(`Could not save intake brief: ${saveResult.error.message}`);

    const leadResult = await client
      .from("leads")
      .update({
        status: "review",
        practice_area_guess: qualification.practice_area,
      })
      .eq("id", leadId);
    if (leadResult.error)
      throw new Error(`Could not queue lead for review: ${leadResult.error.message}`);

    await recordStep({
      trace,
      sequence: 6,
      name: "save-for-review",
      input: { leadId, runId: trace.runId },
      output: { briefId, leadStatus: "review", briefStatus: "review" },
      startedAt: new Date().toISOString(),
      note: "Stopped at the human review boundary",
    });
    await finishRun(trace, {
      inputTokens: qualificationCall.inputTokens + briefCall.inputTokens,
      outputTokens: qualificationCall.outputTokens + briefCall.outputTokens,
    });

    return {
      runId: trace.runId,
      briefId,
      status: "review",
      reused: false,
      qualification,
      brief: guard.brief,
    };
  } catch (error) {
    await failRun(trace, error);
    await client.from("leads").update({ status: "failed" }).eq("id", leadId);
    throw error;
  }
}
