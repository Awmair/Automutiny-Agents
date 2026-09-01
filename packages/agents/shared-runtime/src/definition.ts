export const agentIds = [
  "intake-brief",
  "document-routing",
  "stalled-work",
  "accounting-document-chase",
  "accounting-transaction-review",
  "accounting-filing-readiness",
  "logistics-load-exception",
  "logistics-pod-verification",
  "logistics-invoice-reconciliation",
] as const;

export type AgentId = (typeof agentIds)[number];

export interface AgentDefinition {
  readonly id: AgentId;
  readonly label: string;
  readonly name: string;
  readonly purpose: string;
  readonly humanBoundary: string;
  readonly route: `/${string}`;
}

export function defineAgent<const Definition extends AgentDefinition>(
  definition: Definition,
): Readonly<Definition> {
  for (const [field, value] of Object.entries(definition)) {
    if (value.trim().length === 0) {
      throw new Error(`Agent definition field "${field}" cannot be empty.`);
    }
  }

  if (!definition.route.startsWith("/")) {
    throw new Error("Agent route must start with a slash.");
  }

  return Object.freeze({ ...definition });
}
