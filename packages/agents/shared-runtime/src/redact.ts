const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const phonePattern = /(?<!\d)(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}(?!\d)/g;

export function redactForDisplay<T>(value: T): T {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) return value;

  return JSON.parse(
    serialized.replace(emailPattern, "[redacted email]").replace(phonePattern, "[redacted phone]"),
  ) as T;
}
