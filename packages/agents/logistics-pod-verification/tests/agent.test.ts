import { OperationalOutputSchema } from "@automutiny/agent-runtime";
import { describe, expect, it } from "vitest";
import {
  analyzeLogisticsPod,
  logisticsPodVerificationAgent,
  logisticsPodVerificationScenarios,
} from "../src";

describe("POD Verification Agent", () => {
  it("owns the labelled logistics route", () => {
    expect(logisticsPodVerificationAgent.route).toBe("/logistics/pod-verification");
  });

  it("blocks billing release when damage is noted", () => {
    const scenario = logisticsPodVerificationScenarios[0];
    if (!scenario) throw new Error("Missing POD scenario.");
    const result = analyzeLogisticsPod(scenario.input);
    expect(result.status).toBe("blocked");
    expect(result.exceptions.map((item) => item.title)).toContain("Damage notation");
    expect(result.draft_message).toContain("Billing release remains locked");
  });

  it("returns a valid bounded result for every scenario", () => {
    for (const scenario of logisticsPodVerificationScenarios) {
      expect(OperationalOutputSchema.parse(analyzeLogisticsPod(scenario.input))).toBeTruthy();
    }
  });
});
