"use client";
import { useState } from "react";
export function StalledScenarioRunner() {
  const [days, setDays] = useState(0);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState(
    "Choose a later review date to see upcoming risk without changing stored records.",
  );
  async function run() {
    setRunning(true);
    setMessage("Applying SLA rules, ranking detections and building the brief...");
    try {
      const response = await fetch("/api/run/stalled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ advance_days: days }),
      });
      const result = await response.json();
      if (!response.ok || !result.reportId) throw new Error(result.error ?? "Scan failed.");
      window.location.assign(`/stalled/${result.reportId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Scan failed.");
      setRunning(false);
    }
  }
  return (
    <section className="scenario-section" id="test-live">
      <div className="container scenario-grid compact-runner">
        <div className="scenario-intro">
          <p className="kicker">Test Agent 3 live</p>
          <h2>Scan the firm and prepare Monday’s owner brief.</h2>
          <p>
            Database rules detect risk. Qwen ranks and explains it. Every follow-up still waits for
            human approval.
          </p>
          <div className="scenario-path">
            <span>Records</span>
            <i>→</i>
            <span>SLA scan</span>
            <i>→</i>
            <span>Brief</span>
          </div>
        </div>
        <div className="scenario-form">
          <label className="form-field form-field-wide">
            <span>Review as of</span>
            <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
              <option value={0}>Today</option>
              <option value={7}>+7 days</option>
              <option value={14}>+14 days</option>
              <option value={30}>+30 days</option>
              <option value={90}>+90 days</option>
            </select>
          </label>
          <div className="scenario-submit">
            <button className="button" type="button" onClick={run} disabled={running}>
              {running ? "Agent working..." : "Run Live Stalled Work Agent"}
            </button>
            <p className="run-message">{message}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
