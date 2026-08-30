import { GuardError } from "./errors";

const sensitiveNumberPatterns = [/\b\d{3}-\d{2}-\d{4}\b/, /\b(?:\d[ -]*?){13,19}\b/];

const injectionEchoPatterns = [
  /ignore (?:all |any )?previous instructions/i,
  /reveal (?:the )?system prompt/i,
  /developer message/i,
];

export function assertSafeDraft(text: string) {
  if (sensitiveNumberPatterns.some((pattern) => pattern.test(text))) {
    throw new GuardError("Draft contains a prohibited sensitive-number pattern.");
  }

  if (injectionEchoPatterns.some((pattern) => pattern.test(text))) {
    throw new GuardError("Draft appears to echo prompt-injection language.");
  }
}

export function minimumConfidence() {
  const configured = Number(process.env.MIN_CONFIDENCE ?? "0.6");
  return Number.isFinite(configured) && configured >= 0 && configured <= 1 ? configured : 0.6;
}
