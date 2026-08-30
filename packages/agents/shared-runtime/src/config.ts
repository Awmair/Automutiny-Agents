export const defaultFirmName = "Briar & Calder LLP";

export function configuredFirmName(environment: Record<string, string | undefined> = process.env) {
  return environment.FIRM_NAME?.trim() || defaultFirmName;
}
