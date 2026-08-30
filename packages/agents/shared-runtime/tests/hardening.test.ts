import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { GuardError } from "../src/errors";
import { boundedOutputTokens, boundModelInput } from "../src/limits";
import { callStructured } from "../src/llm";
import { startRun, type TraceContext } from "../src/trace";

const originalEnvironment = {
  fault: process.env.FAULT_INJECT,
  maxInput: process.env.MAX_MODEL_INPUT_CHARS,
  maxOutput: process.env.MAX_OUTPUT_TOKENS,
  node: process.env.NODE_ENV,
  provider: process.env.MODEL_PROVIDER,
};

afterEach(() => {
  const restore = (key: string, value: string | undefined) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };
  restore("FAULT_INJECT", originalEnvironment.fault);
  restore("MAX_MODEL_INPUT_CHARS", originalEnvironment.maxInput);
  restore("MAX_OUTPUT_TOKENS", originalEnvironment.maxOutput);
  restore("NODE_ENV", originalEnvironment.node);
  restore("MODEL_PROVIDER", originalEnvironment.provider);
});

function traceRecorder() {
  const rows: unknown[] = [];
  const client = {
    from: () => ({
      insert: async (row: unknown) => {
        rows.push(row);
        return { error: null };
      },
    }),
  } as unknown as SupabaseClient;
  const trace: TraceContext = { client, runId: "run-1", visitorSessionId: null };
  return { rows, trace };
}

describe("hardening boundaries", () => {
  it("truncates oversized model input and caps output tokens", () => {
    process.env.MAX_MODEL_INPUT_CHARS = "1000";
    process.env.MAX_OUTPUT_TOKENS = "500";
    const bounded = boundModelInput("x".repeat(1200));
    expect(bounded.truncated).toBe(true);
    expect(bounded.originalCharacters).toBe(1200);
    expect(bounded.value).toContain("Input truncated");
    expect(boundedOutputTokens(900)).toBe(500);
  });

  it("runs a schema-valid deterministic mock without a model key", async () => {
    process.env.MODEL_PROVIDER = "mock";
    delete process.env.FAULT_INJECT;
    const { rows, trace } = traceRecorder();
    const schema = z.object({
      practice_area: z.literal("unknown"),
      fit_score: z.number(),
      fit_reasons: z.array(z.string()),
      disqualifiers: z.array(z.string()),
      missing_facts: z.array(z.string()),
      conflict_check_required: z.boolean(),
      urgency: z.literal("low"),
      sol_flag: z.object({ present: z.boolean(), note: z.null() }),
      confidence: z.number(),
    });
    const result = await callStructured({
      trace,
      sequence: 1,
      step: "qualify",
      schema,
      system: "Trusted test rules.",
      user: "Untrusted fixture.",
    });
    expect(result.value.practice_area).toBe("unknown");
    expect(rows).toHaveLength(1);
  });

  it("fails closed after injected invalid model output", async () => {
    process.env.MODEL_PROVIDER = "mock";
    process.env.NODE_ENV = "test";
    process.env.FAULT_INJECT = "llm_bad_json";
    const { trace } = traceRecorder();
    await expect(
      callStructured({
        trace,
        sequence: 1,
        step: "qualify",
        schema: z.object({ value: z.string() }),
        system: "Trusted test rules.",
        user: "Untrusted fixture.",
      }),
    ).rejects.toBeInstanceOf(GuardError);
  });

  it("keeps database fault injection test-only and fails before a run starts", async () => {
    process.env.NODE_ENV = "test";
    process.env.FAULT_INJECT = "db_flap";
    await expect(
      startRun({
        client: {} as SupabaseClient,
        agent: "intake-brief",
        subjectType: "lead",
        subjectId: "fixture",
        model: "mock",
      }),
    ).rejects.toThrow("Injected database failure");
  });
});
