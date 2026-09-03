"use client";

import type { OperationalAgentId } from "@automutiny/db";
import { useState } from "react";

type ScenarioSummary = { id: string; label: string; summary: string };

export function OperationalScenarioRunner({
  agentId,
  scenarios,
  path,
}: {
  agentId: OperationalAgentId;
  scenarios: readonly ScenarioSummary[];
  path: readonly [string, string, string];
}) {
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? "");
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [message, setMessage] = useState("Choose a record set and run the complete workflow.");

  async function run() {
    setStatus("running");
    setMessage("Applying operating rules, validating the result and saving it for review...");
    try {
      const response = await fetch(`/api/run/operations/${agentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });
      const result = (await response.json()) as { caseId?: string; error?: string };
      if (!response.ok || !result.caseId) throw new Error(result.error ?? "The run failed.");
      window.location.assign(`/operations/${result.caseId}`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The run failed.");
    }
  }

  return (
    <section className="scenario-section operations-runner" id="test-live">
      <div className="container scenario-grid">
        <div className="scenario-intro">
          <p className="kicker">Test the agent live</p>
          <h2>Take one record set through the full workflow.</h2>
          <p>The rules do the predictable work. Every final action still waits for a person.</p>
          <div className="scenario-path">
            <span>{path[0]}</span>
            <i>→</i>
            <span>{path[1]}</span>
            <i>→</i>
            <span>{path[2]}</span>
          </div>
        </div>
        <div className="scenario-form">
          <div className="scenario-choice-list" role="radiogroup" aria-label="Demo record set">
            {scenarios.map((scenario) => (
              <label
                className={`scenario-choice ${scenarioId === scenario.id ? "selected" : ""}`}
                key={scenario.id}
              >
                <input
                  type="radio"
                  name={`${agentId}-scenario`}
                  value={scenario.id}
                  checked={scenarioId === scenario.id}
                  onChange={() => setScenarioId(scenario.id)}
                />
                <span>
                  <strong>{scenario.label}</strong>
                  <small>{scenario.summary}</small>
                </span>
              </label>
            ))}
          </div>
          <div className="scenario-submit">
            <button className="button" type="button" onClick={run} disabled={status === "running"}>
              {status === "running" ? "Agent working..." : "Run live workflow"}
            </button>
            <p className={`run-message ${status}`} aria-live="polite">
              {message}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
