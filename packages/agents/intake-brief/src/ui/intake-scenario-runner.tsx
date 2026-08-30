"use client";

import { type FormEvent, useState } from "react";

import { intakeScenarios } from "../scenarios";
import type { IntakeSubmission } from "../schemas";

const emptySubmission: IntakeSubmission = {
  name: "",
  email: "",
  phone: "",
  company: "",
  matter_description: "",
  how_found_us: "Website",
  urgency: "No known deadline.",
};

type RunResponse = {
  briefId?: string;
  error?: string;
};

export function IntakeScenarioRunner() {
  const firstScenario = intakeScenarios[0];
  const [scenarioId, setScenarioId] = useState(firstScenario?.id ?? "custom");
  const [submission, setSubmission] = useState<IntakeSubmission>(
    firstScenario?.submission ?? emptySubmission,
  );
  const [status, setStatus] = useState<"idle" | "running" | "error">("idle");
  const [message, setMessage] = useState("");

  function selectScenario(id: string) {
    setScenarioId(id);
    const scenario = intakeScenarios.find((item) => item.id === id);
    setSubmission(scenario ? scenario.submission : emptySubmission);
    setStatus("idle");
    setMessage("");
  }

  function update(field: keyof IntakeSubmission, value: string) {
    setSubmission((current) => ({ ...current, [field]: value }));
  }

  async function runScenario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("running");
    setMessage("Creating the lead, applying firm rules and preparing the review trace…");

    try {
      const response = await fetch("/api/run/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
      const result = (await response.json()) as RunResponse;
      if (!response.ok || !result.briefId) {
        throw new Error(result.error ?? "The intake run could not be completed.");
      }
      window.location.assign(`/intake/${result.briefId}`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The intake run could not be completed.");
    }
  }

  return (
    <section className="scenario-section" aria-labelledby="scenario-title">
      <div className="container scenario-grid">
        <div className="scenario-intro">
          <p className="kicker">Run Agent 1</p>
          <h2 id="scenario-title">Send an inquiry through the full intake path.</h2>
          <p>
            Pick a prepared situation or enter your own. The agent will create a lead, apply the
            firm rules, call Qwen, save every trace step and stop at human review.
          </p>
          <div className="scenario-path">
            <span>Inquiry</span>
            <i>→</i>
            <span>Agent</span>
            <i>→</i>
            <span>Review</span>
          </div>
        </div>

        <form className="scenario-form" onSubmit={runScenario}>
          <label className="form-field form-field-wide">
            <span>Situation</span>
            <select value={scenarioId} onChange={(event) => selectScenario(event.target.value)}>
              {intakeScenarios.map((scenario) => (
                <option value={scenario.id} key={scenario.id}>
                  {scenario.label}
                </option>
              ))}
              <option value="custom">Custom inquiry</option>
            </select>
            <small>
              {intakeScenarios.find((scenario) => scenario.id === scenarioId)?.summary ??
                "Enter a new inquiry below."}
            </small>
          </label>

          <div className="form-columns">
            <label className="form-field">
              <span>Name</span>
              <input
                required
                value={submission.name}
                onChange={(event) => update("name", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Email</span>
              <input
                required
                type="email"
                value={submission.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Phone</span>
              <input
                value={submission.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Company</span>
              <input
                value={submission.company}
                onChange={(event) => update("company", event.target.value)}
              />
            </label>
          </div>

          <label className="form-field form-field-wide">
            <span>What happened?</span>
            <textarea
              required
              rows={7}
              value={submission.matter_description}
              onChange={(event) => update("matter_description", event.target.value)}
            />
          </label>

          <div className="form-columns">
            <label className="form-field">
              <span>How they found the firm</span>
              <input
                required
                value={submission.how_found_us}
                onChange={(event) => update("how_found_us", event.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Urgency or known dates</span>
              <input
                required
                value={submission.urgency}
                onChange={(event) => update("urgency", event.target.value)}
              />
            </label>
          </div>

          <div className="scenario-submit">
            <button className="button" type="submit" disabled={status === "running"}>
              {status === "running" ? "Agent working…" : "Run Intake Agent"}
            </button>
            <p className={`run-message ${status}`} aria-live="polite">
              {message || "Up to 10 runs per visitor each day."}
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
