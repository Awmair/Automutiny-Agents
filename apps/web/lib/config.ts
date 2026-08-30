export const defaultFirmName = "Briar & Calder LLP";

export function configuredFirmName() {
  return process.env.FIRM_NAME?.trim() || defaultFirmName;
}
