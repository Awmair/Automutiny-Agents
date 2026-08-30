export const agentIds = ["intake-brief", "document-routing", "stalled-work"] as const;

export type AgentId = (typeof agentIds)[number];

export interface AgentDefinition {
  readonly id: AgentId;
  readonly label: string;
  readonly name: string;
  readonly purpose: string;
  readonly humanBoundary: string;
  readonly route: `/${string}`;
}

export function defineAgent(definition: AgentDefinition): Readonly<AgentDefinition> {
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
