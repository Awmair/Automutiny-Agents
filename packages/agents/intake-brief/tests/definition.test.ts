import { describe, expect, it } from "vitest";

import { intakeBriefAgent } from "../src";

describe("intakeBriefAgent", () => {
  it("publishes the intake route and human boundary", () => {
    expect(intakeBriefAgent.route).toBe("/intake");
    expect(intakeBriefAgent.humanBoundary).toContain("Whether to take the matter");
  });
});
