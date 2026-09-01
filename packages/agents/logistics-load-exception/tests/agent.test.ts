import { OperationalOutputSchema } from "@automutiny/agent-runtime";
import { describe, expect, it } from "vitest";
import {
  analyzeLogisticsLoadException,
  logisticsLoadExceptionAgent,
  logisticsLoadExceptionScenarios,
} from "../src";

describe("Load Exception Agent", () => {
  it("owns the labelled logistics route", () => {
    expect(logisticsLoadExceptionAgent.route).toBe("/logistics/load-exception");
  });

  it("escalates a late temperature-controlled load", () => {
    const scenario = logisticsLoadExceptionScenarios[0];
    if (!scenario) throw new Error("Missing load-exception scenario.");
    const result = analyzeLogisticsLoadException(scenario.input);
    expect(result.priority).toBe("high");
    expect(result.status).toBe("blocked");
    expect(result.exceptions.map((item) => item.title)).toContain("Temperature excursion");
  });

  it("returns a valid bounded result for every scenario", () => {
    for (const scenario of logisticsLoadExceptionScenarios) {
      expect(
        OperationalOutputSchema.parse(analyzeLogisticsLoadException(scenario.input)),
      ).toBeTruthy();
    }
  });
});
