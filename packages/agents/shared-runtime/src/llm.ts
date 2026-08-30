import { createGroq, type GroqLanguageModelOptions } from "@ai-sdk/groq";
import { generateText, Output } from "ai";
import type { z } from "zod";

import { GuardError } from "./errors";
import { activeFault } from "./fault";
import { assertTokenBudget, boundedOutputTokens, boundModelInput } from "./limits";
import { mockStructuredValue } from "./mock";
import { recordStep, type TraceContext } from "./trace";

export const defaultGroqModel = "qwen/qwen3.6-27b";

type StructuredCallInput<T> = {
  trace: TraceContext;
  sequence: number;
  step: string;
  schema: z.ZodType<T>;
  system: string;
  user: string;
  model?: string;
  maxOutputTokens?: number;
};

export type StructuredCallResult<T> = {
  value: T;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  model: string;
};

type RawCallResult<T> = {
  output: T;
  text: string;
  usage: { inputTokens: number | undefined; outputTokens: number | undefined };
};

function readGroqKey() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is required for live agent runs.");
  return apiKey;
}

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryDelay(error: unknown, attempt: number) {
  const message = error instanceof Error ? error.message : "";
  const seconds = message.match(/try again in ([0-9.]+)s/iu)?.[1];
  if (seconds) return Math.min(Math.ceil(Number(seconds) * 1_000) + 1_000, 30_000);
  return 250 * 2 ** attempt;
}

function errorMessage(error: unknown) {
  if (!(error instanceof Error)) return "Unknown structured output error";
  const cause = error.cause instanceof Error ? `: ${error.cause.message}` : "";
  return `${error.message}${cause}`;
}

export async function callStructured<T>(
  input: StructuredCallInput<T>,
): Promise<StructuredCallResult<T>> {
  const model = input.model ?? process.env.MODEL_ID ?? defaultGroqModel;
  const provider = process.env.MODEL_PROVIDER ?? "groq";
  if (provider !== "groq" && provider !== "mock") {
    throw new GuardError(`Unsupported MODEL_PROVIDER: ${provider}`);
  }
  const groq = provider === "groq" ? createGroq({ apiKey: readGroqKey() }) : null;
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const boundedUser = boundModelInput(input.user);
  const maxOutputTokens = boundedOutputTokens(input.maxOutputTokens ?? 2_000);
  let lastError: unknown;
  const attemptErrors: string[] = [];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const fault = activeFault();
      if (fault === "llm_timeout") throw new Error("Injected model timeout.");
      if (fault === "llm_bad_json") input.schema.parse({ invalid: true });
      let result: RawCallResult<T>;
      if (provider === "mock") {
        result = {
          output: input.schema.parse(mockStructuredValue(input.step, boundedUser.value)),
          text: JSON.stringify(mockStructuredValue(input.step, boundedUser.value)),
          usage: { inputTokens: 0, outputTokens: 0 },
        };
      } else {
        if (!groq) throw new GuardError("Groq provider was not initialized.");
        const generated = await generateText({
          model: groq(model),
          system: input.system,
          prompt: `${boundedUser.value}\n\nReturn only the requested JSON object.`,
          temperature: 0,
          reasoning: "none",
          maxOutputTokens,
          maxRetries: 0,
          abortSignal: AbortSignal.timeout(30_000),
          output: Output.object({
            schema: input.schema,
            name: input.step.replaceAll("-", "_"),
          }),
          providerOptions: {
            groq: {
              structuredOutputs: false,
            } satisfies GroqLanguageModelOptions,
          },
        });
        result = {
          output: generated.output as T,
          text: generated.text,
          usage: generated.usage,
        };
      }
      const latencyMs = Date.now() - started;
      const inputTokens = result.usage.inputTokens ?? 0;
      const outputTokens = result.usage.outputTokens ?? 0;
      assertTokenBudget(inputTokens, outputTokens);

      await recordStep({
        trace: input.trace,
        sequence: input.sequence,
        name: input.step,
        input: {
          model,
          provider,
          system: input.system,
          user: boundedUser.value,
          input_truncated: boundedUser.truncated,
          original_input_characters: boundedUser.originalCharacters,
          max_output_tokens: maxOutputTokens,
        },
        output: { raw: result.text, parsed: result.output },
        startedAt,
        tokens: inputTokens + outputTokens,
        note: `${provider === "mock" ? "Deterministic mock" : "Groq"} call · ${latencyMs}ms · attempt ${attempt + 1}${boundedUser.truncated ? " · input truncated" : ""}`,
      });

      return {
        value: result.output as T,
        inputTokens,
        outputTokens,
        latencyMs,
        model,
      };
    } catch (error) {
      lastError = error;
      attemptErrors.push(errorMessage(error));
      if (attempt < 2 && activeFault() !== "llm_timeout" && activeFault() !== "llm_bad_json") {
        await delay(retryDelay(error, attempt));
      }
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "Unknown structured output error";
  const errorSummary = attemptErrors
    .map((error, index) => `Attempt ${index + 1}: ${error}`)
    .join(" | ");
  await recordStep({
    trace: input.trace,
    sequence: input.sequence,
    name: input.step,
    input: {
      model,
      provider,
      system: input.system,
      user: boundedUser.value,
      input_truncated: boundedUser.truncated,
      original_input_characters: boundedUser.originalCharacters,
      max_output_tokens: maxOutputTokens,
    },
    output: { error: message, attempts: attemptErrors },
    startedAt,
    note: "Groq structured output failed after 3 attempts",
  });
  throw new GuardError(`${input.step} failed schema validation after retries: ${errorSummary}`);
}
