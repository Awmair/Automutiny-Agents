"use client";
import { useState } from "react";
import { documentScenarios } from "../scenarios";

export function DocumentScenarioRunner() {
  const [scenario, setScenario] = useState(documentScenarios[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState(
    "Choose an anonymized PDF or upload your own (10 MB max).",
  );
  const [running, setRunning] = useState(false);
  async function run() {
    setRunning(true);
    setMessage("Extracting, classifying, checking and preparing human review...");
    try {
      const body = new FormData();
      if (file) body.set("file", file);
      else body.set("scenario", scenario);
      const response = await fetch("/api/run/document", { method: "POST", body });
      const result = (await response.json()) as { resultId?: string; error?: string };
      if (!response.ok || !result.resultId) throw new Error(result.error ?? "Document run failed.");
      window.location.assign(`/documents/${result.resultId}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Document run failed.");
      setRunning(false);
    }
  }
  return (
    <section className="scenario-section" id="test-live">
      <div className="container scenario-grid compact-runner">
        <div className="scenario-intro">
          <p className="kicker">Test Agent 2 live</p>
          <h2>Put a PDF through the full routing path.</h2>
          <p>
            Text is extracted, Qwen classifies it, firm rules check the match and completeness, then
            the agent stops for you.
          </p>
          <div className="scenario-path">
            <span>PDF</span>
            <i>→</i>
            <span>Agent</span>
            <i>→</i>
            <span>Review</span>
          </div>
        </div>
        <div className="scenario-form">
          <label className="form-field form-field-wide">
            <span>Prepared situation</span>
            <select
              value={scenario}
              onChange={(event) => {
                setScenario(event.target.value);
                setFile(null);
              }}
            >
              {documentScenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} - {item.summary}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field form-field-wide">
            <span>Or upload a PDF</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="scenario-submit">
            <button className="button" type="button" onClick={run} disabled={running}>
              {running ? "Agent working..." : "Run Live Document Agent"}
            </button>
            <p className="run-message">{message}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
