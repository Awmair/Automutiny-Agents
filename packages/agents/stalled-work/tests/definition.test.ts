import { describe, expect, it } from "vitest";

import { stalledWorkAgent } from "../src";

describe("stalledWorkAgent", () => {
  it("publishes the stalled-work route and human boundary", () => {
    expect(stalledWorkAgent.route).toBe("/stalled");
    expect(stalledWorkAgent.humanBoundary).toContain("deadline strategy");
  });
});
