import { GuardError } from "./errors";

function boundedNumber(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

export function maxModelInputCharacters(
  environment: Record<string, string | undefined> = process.env,
) {
  return boundedNumber(environment.MAX_MODEL_INPUT_CHARS, 12_000, 1_000, 100_000);
}

export function boundModelInput(
  value: string,
  environment: Record<string, string | undefined> = process.env,
) {
  const maximum = maxModelInputCharacters(environment);
  if (value.length <= maximum) {
    return { value, truncated: false, originalCharacters: value.length };
  }
  return {
    value: `${value.slice(0, maximum)}\n\n[Input truncated at the configured model boundary.]`,
    truncated: true,
    originalCharacters: value.length,
  };
}

export function boundedOutputTokens(
  requested: number,
  environment: Record<string, string | undefined> = process.env,
) {
  const maximum = boundedNumber(environment.MAX_OUTPUT_TOKENS, 2_000, 100, 16_384);
  return Math.min(requested, maximum);
}

export function assertTokenBudget(
  inputTokens: number,
  outputTokens: number,
  environment: Record<string, string | undefined> = process.env,
) {
  const maximum = boundedNumber(environment.MAX_RUN_TOKENS, 12_000, 500, 200_000);
  if (inputTokens + outputTokens > maximum) {
    throw new GuardError(`Model token budget exceeded the configured ${maximum}-token limit.`);
  }
}
