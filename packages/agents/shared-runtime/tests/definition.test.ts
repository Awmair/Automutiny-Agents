import { describe, expect, it } from "vitest";

import { defineAgent } from "../src";

describe("defineAgent", () => {
  it("returns immutable validated metadata", () => {
    const definition = defineAgent({
      id: "intake-brief",
      label: "Agent 1",
      name: "Intake Brief Agent",
      purpose: "Prepares an intake brief.",
      humanBoundary: "A human decides whether to take the matter.",
      route: "/intake",
    });

    expect(Object.isFrozen(definition)).toBe(true);
  });

  it("rejects an empty field", () => {
    expect(() =>
      defineAgent({
        id: "intake-brief",
        label: "",
        name: "Intake Brief Agent",
        purpose: "Prepares an intake brief.",
        humanBoundary: "A human decides whether to take the matter.",
        route: "/intake",
      }),
    ).toThrow('Agent definition field "label" cannot be empty.');
  });
});
