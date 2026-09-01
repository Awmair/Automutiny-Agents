"use client";

import type { OperationalCaseDetail } from "@automutiny/db";
import { useState } from "react";

type AgentCopy = { label: string; name: string; humanBoundary: string };

function readable(value: string) {
  return value.replaceAll("_", " ");
}

export function OperationalReviewPanel({
  detail,
  agent,
  canReview,
}: {
  detail: OperationalCaseDetail;
  agent: AgentCopy;
  canReview: boolean;
}) {
  const [tab, setTab] = useState<"review" | "trace">("review");
  const [status, setStatus] = useState(detail.status);
  const [editedMessage, setEditedMessage] = useState(detail.output.draft_message);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(
    canReview ? "Nothing happens until you decide." : "Reference record is read-only.",
  );
  const actionEnabled = canReview && status === "review" && !busy;

  async function decide(decision: "approve" | "edit" | "reject") {
    setBusy(true);
    setMessage("Saving the human decision...");
    try {
      const response = await fetch(`/api/review/operations/${detail.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          edited_message: decision === "edit" ? editedMessage : undefined,
          reason: decision === "reject" ? rejectReason : undefined,
        }),
      });
      const result = (await response.json()) as { status?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "The review failed.");
      setStatus(result.status ?? decision);
      setMessage("Decision saved. No external system was changed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The review failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="detail-main operational-detail">
      <section className="detail-hero operational-detail-hero">
        <div className="container detail-hero-grid">
          <div>
            <p className="kicker">{agent.label} / Human review</p>
            <h1>{detail.subject}</h1>
            <p className="queue-lead">{detail.output.headline}</p>
          </div>
          <div className="detail-scorecard">
            <div
              className={`detail-fit-status signal-${detail.output.priority === "high" ? "alert" : detail.output.priority === "medium" ? "watch" : "positive"}`}
            >
              <strong>{Math.round(detail.output.confidence * 100)}%</strong>
              <span>{readable(detail.output.priority)} priority</span>
            </div>
            <div className="detail-action-summary">
              <span>Agent status</span>
              <strong>{readable(detail.output.status)}</strong>
              <small>{readable(status)} · human decision required</small>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-workspace">
        <div className="container">
          <nav className="detail-tabs" aria-label="Operational case views">
            <button
              type="button"
              className={tab === "review" ? "active" : ""}
              onClick={() => setTab("review")}
            >
              Owner view
            </button>
            <button
              type="button"
              className={tab === "trace" ? "active" : ""}
              onClick={() => setTab("trace")}
            >
              Under the hood
            </button>
          </nav>

          {tab === "review" ? (
            <div className="owner-cockpit operational-cockpit">
              <section className="operational-topline">
                {detail.output.signals.map((signal) => (
                  <article
                    className={`qualification-signal signal-${signal.tone}`}
                    key={signal.label}
                  >
                    <span>{signal.label}</span>
                    <strong>{signal.value}</strong>
                  </article>
                ))}
              </section>

              <section className="operational-review-grid">
                <article className="detail-card operational-summary-card">
                  <span className="detail-label">Agent summary</span>
                  <p>{detail.output.summary}</p>
                  <span className="detail-label secondary-label">Recommended action</span>
                  <p>{detail.output.recommended_action}</p>
                </article>
                <article className="detail-card operational-checks-card">
                  <span className="detail-label">Checks performed</span>
                  <div className="operational-checks">
                    {detail.output.checks.map((check) => (
                      <div key={check.label}>
                        <span className={`check-dot check-${check.status}`} />
                        <p>
                          <strong>{check.label}</strong>
                          <small>{check.detail}</small>
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              </section>

              <section className="operational-exceptions" aria-label="Exceptions">
                <div className="operational-section-head">
                  <div>
                    <p className="kicker">Exceptions</p>
                    <h2>
                      {detail.output.exceptions.length} item
                      {detail.output.exceptions.length === 1 ? "" : "s"} need attention.
                    </h2>
                  </div>
                </div>
                {detail.output.exceptions.length ? (
                  detail.output.exceptions.map((exception, index) => (
                    <details className="stalled-card" key={exception.title} open={index === 0}>
                      <summary className="stalled-card-summary">
                        <div className="stalled-card-heading">
                          <div className="stalled-card-tags">
                            <span className={`decision-chip ${detail.output.priority}`}>
                              {detail.output.priority}
                            </span>
                            <span className="issue-chip">review</span>
                          </div>
                          <h2>{exception.title}</h2>
                          <p>{exception.impact}</p>
                        </div>
                        <span className="stalled-card-toggle" aria-hidden="true" />
                      </summary>
                      <div className="stalled-card-detail operational-exception-detail">
                        <div>
                          <b>Evidence</b>
                          <p>{exception.evidence}</p>
                        </div>
                        <div>
                          <b>Prepared next step</b>
                          <p>{exception.recommended_action}</p>
                        </div>
                      </div>
                    </details>
                  ))
                ) : (
                  <article className="detail-card">
                    <p>No exception crossed the review threshold.</p>
                  </article>
                )}
              </section>

              <article className="detail-card owner-detail-panel operational-decision-panel">
                <div className="detail-card-head">
                  <span className="detail-label">Prepared message or internal note</span>
                  <small>Nothing sends automatically</small>
                </div>
                <textarea
                  rows={5}
                  value={editedMessage}
                  onChange={(event) => setEditedMessage(event.target.value)}
                  disabled={!canReview || status !== "review"}
                />
                <footer className="decision-bar">
                  <div className="decision-copy">
                    <span className="detail-label">Human boundary</span>
                    <p>{agent.humanBoundary}</p>
                    <p className="review-message" aria-live="polite">
                      {message}
                    </p>
                  </div>
                  <div className="decision-controls">
                    <div className="review-actions">
                      <button
                        type="button"
                        disabled={!actionEnabled}
                        onClick={() => decide("approve")}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={!actionEnabled}
                        onClick={() => decide("edit")}
                      >
                        Save edited version
                      </button>
                    </div>
                    <div className="reject-row">
                      <input
                        placeholder="Reason required to reject"
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        disabled={!canReview || status !== "review"}
                      />
                      <button
                        type="button"
                        disabled={!actionEnabled || !rejectReason.trim()}
                        onClick={() => decide("reject")}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </footer>
              </article>
            </div>
          ) : (
            <div className="trace-layout">
              <header className="trace-summary">
                <div>
                  <span>Engine</span>
                  <strong>{detail.run.model}</strong>
                </div>
                <div>
                  <span>Tokens</span>
                  <strong>{detail.run.inputTokens + detail.run.outputTokens}</strong>
                </div>
                <div>
                  <span>Cost</span>
                  <strong>${detail.run.costUsd.toFixed(2)}</strong>
                </div>
                <div>
                  <span>Steps</span>
                  <strong>{detail.steps.length}</strong>
                </div>
              </header>
              <ol className="trace-list">
                {detail.steps.map((step) => (
                  <li key={`${step.sequence}-${step.name}`}>
                    <div className="trace-number">{String(step.sequence).padStart(2, "0")}</div>
                    <article>
                      <header>
                        <div>
                          <h2>{readable(step.name)}</h2>
                          <p>{step.note}</p>
                        </div>
                        <span>{step.tokens} tokens</span>
                      </header>
                      <details>
                        <summary>Show redacted input and output</summary>
                        <div className="trace-json-grid">
                          <div>
                            <span>Input</span>
                            <pre>{JSON.stringify(step.input, null, 2)}</pre>
                          </div>
                          <div>
                            <span>Output</span>
                            <pre>{JSON.stringify(step.output, null, 2)}</pre>
                          </div>
                        </div>
                      </details>
                    </article>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
