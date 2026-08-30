export const faultModes = ["llm_timeout", "llm_bad_json", "lookup_down", "db_flap"] as const;
export type FaultMode = (typeof faultModes)[number];

export function activeFault(
  environment: Record<string, string | undefined> = process.env,
): FaultMode | null {
  if (environment.NODE_ENV !== "test") return null;
  const configured = environment.FAULT_INJECT;
  return faultModes.find((mode) => mode === configured) ?? null;
}
