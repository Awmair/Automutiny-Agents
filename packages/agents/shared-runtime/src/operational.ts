import { randomUUID } from "node:crypto";
import type { OperationalAgentId, OperationalOutput } from "@automutiny/db";
import { createServerDatabaseClient } from "@automutiny/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { failRun, finishRun, recordStep, startRun } from "./trace";

export const OperationalOutputSchema = z
  .object({
    headline: z.string().trim().min(3).max(160),
    summary: z.string().trim().min(3).max(600),
    status: z.enum(["ready", "needs_review", "blocked"]),
    priority: z.enum(["low", "medium", "high"]),
    confidence: z.number().min(0).max(1),
    signals: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(80),
            value: z.string().trim().min(1).max(160),
            tone: z.enum(["positive", "watch", "alert", "neutral"]),
          })
          .strict(),
      )
      .min(2)
      .max(6),
    exceptions: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(140),
            evidence: z.string().trim().min(1).max(320),
            impact: z.string().trim().min(1).max(260),
            recommended_action: z.string().trim().min(1).max(320),
          })
          .strict(),
      )
      .max(8),
    checks: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(100),
            status: z.enum(["pass", "review", "fail"]),
            detail: z.string().trim().min(1).max(260),
          })
          .strict(),
      )
      .min(2)
      .max(8),
    recommended_action: z.string().trim().min(1).max(360),
    draft_message: z.string().trim().min(1).max(1_200),
  })
  .strict();

export const OperationalReviewInputSchema = z
  .object({
    decision: z.enum(["approve", "edit", "reject"]),
    edited_message: z.string().trim().min(3).max(1_200).optional(),
    reason: z.string().trim().min(3).max(500).optional(),
  })
  .strict()
  .superRefine((review, context) => {
    if (review.decision === "edit" && !review.edited_message) {
      context.addIssue({
        code: "custom",
        path: ["edited_message"],
        message: "An edited message is required for an edit decision.",
      });
    }
    if (review.decision === "reject" && !review.reason) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "A reason is required for rejection.",
      });
    }
  });

export type OperationalReviewInput = z.infer<typeof OperationalReviewInputSchema>;

export type OperationalScenario<TInput extends Record<string, unknown>> = {
  id: string;
  label: string;
  summary: string;
  subject: string;
  input: TInput;
};

type RunInput<TInput extends Record<string, unknown>> = {
  agentId: OperationalAgentId;
  scenario: OperationalScenario<TInput>;
  analyze: (input: TInput) => OperationalOutput;
  client?: SupabaseClient;
  visitorSessionId: string;
};

export async function runOperationalCase<TInput extends Record<string, unknown>>(
  input: RunInput<TInput>,
) {
  const client = input.client ?? createServerDatabaseClient();
  const caseId = randomUUID();
  const trace = await startRun({
    client,
    agent: input.agentId,
    subjectType: "operational-case",
    subjectId: caseId,
    model: "deterministic-rules-v1",
    visitorSessionId: input.visitorSessionId,
  });

  try {
    await recordStep({
      trace,
      sequence: 1,
      name: "load-records",
      input: { scenario_id: input.scenario.id },
      output: input.scenario.input,
      startedAt: new Date().toISOString(),
      note: "Loaded the bounded scenario records for this visitor session",
    });

    const prepared = input.analyze(input.scenario.input);
    await recordStep({
      trace,
      sequence: 2,
      name: "apply-rules",
      input: input.scenario.input,
      output: prepared,
      startedAt: new Date().toISOString(),
      note: "Applied the agent's deterministic operating rules before review",
    });

    const output = OperationalOutputSchema.parse(prepared);
    await recordStep({
      trace,
      sequence: 3,
      name: "validate-output",
      input: { schema: "operational-output-v1", human_review_required: true },
      output: {
        valid: true,
        confidence: output.confidence,
        exception_count: output.exceptions.length,
      },
      startedAt: new Date().toISOString(),
      note: "Validated the bounded result and kept the consequential action locked",
    });

    const saved = await client.from("operational_cases").insert({
      id: caseId,
      agent: input.agentId,
      scenario_id: input.scenario.id,
      subject: input.scenario.subject,
      input_json: input.scenario.input,
      output_json: output,
      confidence: output.confidence,
      priority: output.priority,
      run_id: trace.runId,
      status: "review",
      visitor_session_id: input.visitorSessionId,
    });
    if (saved.error) throw new Error(`Could not save operational case: ${saved.error.message}`);

    await recordStep({
      trace,
      sequence: 4,
      name: "save-for-review",
      input: { case_id: caseId },
      output: { status: "review", external_action_taken: false },
      startedAt: new Date().toISOString(),
      note: "Saved the prepared work and stopped for a human decision",
    });
    await finishRun(trace, { inputTokens: 0, outputTokens: 0 });

    return { caseId, runId: trace.runId, status: "review" as const };
  } catch (error) {
    await failRun(trace, error);
    throw error;
  }
}
