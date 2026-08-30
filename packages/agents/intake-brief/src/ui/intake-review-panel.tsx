"use client";

import { useState } from "react";

import type { IntakeReviewDetail } from "../types";

type ReviewResponse = {
  error?: string;
  briefStatus?: string;
  outboxQueued?: boolean;
};

function readable(value: string) {
  return value.replaceAll("_", " ");
}

function list(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function number(value: unknown) {
  return typeof value === "number" ? value : null;
}

type BriefSection = "who" | "what" | "history" | "fit" | "risks";
type SignalTone = "positive" | "watch" | "alert" | "neutral";
type OwnerDetailTab = "reply" | "facts" | "questions" | "qualification";

function briefSection(value: string): BriefSection | null {
  switch (value.toLowerCase()) {
    case "who":
    case "what":
    case "history":
    case "fit":
    case "risks":
      return value.toLowerCase() as BriefSection;
    default:
      return null;
  }
}

function parseBrief(markdown: string) {
  const sectionLines: Record<BriefSection, string[]> = {
    who: [],
    what: [],
    history: [],
    fit: [],
    risks: [],
  };
  let activeSection: BriefSection | null = null;

  for (const rawLine of markdown.split("\n")) {
    const heading = rawLine.match(/^#{1,6}\s+(who|what|history|fit|risks)\s*$/i);
    if (heading?.[1]) {
      activeSection = briefSection(heading[1]);
      continue;
    }

    const line = rawLine.trim();
    if (activeSection && line) sectionLines[activeSection].push(line);
  }

  return {
    who: sectionLines.who.join(" ") || "Not provided.",
    what: sectionLines.what.join(" ") || "Not provided.",
    history: sectionLines.history.join(" ") || "Not provided.",
    fit: sectionLines.fit.join(" ") || "Not scored.",
    risks: sectionLines.risks.join(" ") || "No risks were listed.",
  };
}

function fitCategory(score: number | null): {
  label: string;
  tone: SignalTone;
} {
  if (score === null) return { label: "Not scored", tone: "neutral" };
  if (score >= 8) return { label: "Strong firm fit", tone: "positive" };
  if (score >= 5) return { label: "Possible firm fit", tone: "watch" };
  return { label: "Low firm fit", tone: "alert" };
}

export function IntakeReviewPanel({
  detail,
  canReview,
}: {
  detail: IntakeReviewDetail;
  canReview: boolean;
}) {
  const [tab, setTab] = useState<"owner" | "trace">("owner");
  const [ownerDetailTab, setOwnerDetailTab] = useState<OwnerDetailTab>("reply");
  const [editedReply, setEditedReply] = useState(detail.replyDraft);
  const [rejectReason, setRejectReason] = useState("");
  const [status, setStatus] = useState(detail.status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const qualification = detail.qualification ?? detail.qualificationRaw;
  const fitScore = number(qualification.fit_score);
  const fitReasons = list(qualification.fit_reasons);
  const missingFacts = list(qualification.missing_facts);
  const disqualifiers = list(qualification.disqualifiers);
  const brief = parseBrief(detail.briefMd);
  const fit = fitCategory(fitScore);
  const urgency =
    typeof qualification.urgency === "string" ? qualification.urgency.toLowerCase() : "unknown";
  const conflictRequired = qualification.conflict_check_required === true;
  const qualificationSignals: Array<{ label: string; value: string; tone: SignalTone }> = [
    {
      label: "Urgency",
      value: urgency === "unknown" ? "Not scored" : readable(urgency),
      tone:
        urgency === "high"
          ? "alert"
          : urgency === "medium"
            ? "watch"
            : urgency === "low"
              ? "positive"
              : "neutral",
    },
    {
      label: "Conflict",
      value: conflictRequired ? "Check required" : "Not flagged",
      tone: conflictRequired ? "watch" : "positive",
    },
    {
      label: "Missing facts",
      value: missingFacts.length ? `${missingFacts.length} to collect` : "None flagged",
      tone: missingFacts.length ? "watch" : "positive",
    },
    {
      label: "Human context",
      value: detail.needsHumanContext ? "Review required" : "Context sufficient",
      tone: detail.needsHumanContext ? "watch" : "positive",
    },
  ];
  const ownerDetailTabs: Array<{ id: OwnerDetailTab; label: string; count?: number }> = [
    { id: "reply", label: "Reply draft" },
    { id: "facts", label: "Missing facts", count: missingFacts.length },
    { id: "questions", label: "Call questions", count: detail.questionsForCall.length },
    { id: "qualification", label: "Qualification" },
  ];
  const actionEnabled = canReview && status === "review" && !busy;

  async function decide(decision: "approve" | "edit" | "reject") {
    setBusy(true);
    setMessage("Saving the human decision…");
    try {
      const response = await fetch(`/api/review/intake/${detail.briefId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          edited_reply: decision === "edit" ? editedReply : undefined,
          reason: decision === "reject" ? rejectReason : undefined,
        }),
      });
      const result = (await response.json()) as ReviewResponse;
      if (!response.ok) throw new Error(result.error ?? "The review could not be saved.");
      setStatus(result.briefStatus ?? decision);
      setMessage(
        result.outboxQueued
          ? "Decision saved. The reply is in the simulated outbox; no email was sent."
          : "Decision saved. No reply was queued.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The review could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="detail-main">
      <section className="detail-hero">
        <div className="container detail-hero-grid">
          <div>
            <p className="kicker">Agent 1 / Human review</p>
            <h1>{detail.subject}</h1>
          </div>
          <div className="detail-scorecard">
            <div className={`detail-fit-status signal-${fit.tone}`}>
              <strong>{fitScore === null ? "—" : fitScore}</strong>
              <span>{fit.label}</span>
            </div>
            <div className="detail-action-summary">
              <span>Recommended action</span>
              <strong>{readable(detail.nextAction)}</strong>
              <small>
                {Math.round(detail.confidence * 100)}% confidence · {readable(status)}
              </small>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-workspace">
        <div className="container">
          <nav className="detail-tabs" aria-label="Intake brief views">
            <button
              type="button"
              className={tab === "owner" ? "active" : ""}
              onClick={() => setTab("owner")}
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

          {tab === "owner" ? (
            <div className="owner-cockpit">
              <div className="cockpit-overview">
                <article className="detail-card cockpit-summary-card">
                  <span className="detail-label">Matter snapshot</span>
                  <dl className="cockpit-summary-list">
                    <div>
                      <dt>Client</dt>
                      <dd>{brief.who}</dd>
                    </div>
                    <div>
                      <dt>Matter</dt>
                      <dd>{brief.what}</dd>
                    </div>
                    <div>
                      <dt>History</dt>
                      <dd>{brief.history}</dd>
                    </div>
                  </dl>
                </article>

                <article className="detail-card cockpit-qualification-card">
                  <div className="qualification-head">
                    <span className="detail-label">Qualification signals</span>
                    <span className={`qualification-status signal-${fit.tone}`}>{fit.label}</span>
                  </div>
                  <p className="qualification-reason">{detail.nextActionReason}</p>
                  <div className="qualification-signals">
                    {qualificationSignals.map((signal) => (
                      <div
                        className={`qualification-signal signal-${signal.tone}`}
                        key={signal.label}
                      >
                        <span>{signal.label}</span>
                        <strong>{signal.value}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              </div>

              <article className="cockpit-risk">
                <strong>Risks</strong>
                <p>{brief.risks}</p>
              </article>

              <article className="detail-card owner-detail-panel">
                <div className="owner-detail-tabs" aria-label="Intake details" role="tablist">
                  {ownerDetailTabs.map((ownerTab) => (
                    <button
                      type="button"
                      role="tab"
                      id={`owner-tab-${ownerTab.id}`}
                      aria-controls={`owner-panel-${ownerTab.id}`}
                      aria-selected={ownerDetailTab === ownerTab.id}
                      className={ownerDetailTab === ownerTab.id ? "active" : ""}
                      key={ownerTab.id}
                      onClick={() => setOwnerDetailTab(ownerTab.id)}
                    >
                      {ownerTab.label}
                      {ownerTab.count === undefined ? null : <span>{ownerTab.count}</span>}
                    </button>
                  ))}
                </div>

                <section
                  className="owner-tab-content"
                  role="tabpanel"
                  id={`owner-panel-${ownerDetailTab}`}
                  aria-labelledby={`owner-tab-${ownerDetailTab}`}
                >
                  {ownerDetailTab === "reply" ? (
                    <div className="reply-panel">
                      <div className="detail-card-head">
                        <span className="detail-label">First reply draft</span>
                        <small>Nothing sends automatically</small>
                      </div>
                      <textarea
                        rows={5}
                        value={editedReply}
                        onChange={(event) => setEditedReply(event.target.value)}
                        disabled={!canReview || status !== "review"}
                      />
                    </div>
                  ) : null}

                  {ownerDetailTab === "facts" ? (
                    <div className="detail-tab-copy">
                      <span className="detail-label">Missing facts to collect</span>
                      {missingFacts.length ? (
                        <ul className="owner-tab-list">
                          {missingFacts.map((fact) => (
                            <li key={fact}>{fact}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No required facts were flagged as missing.</p>
                      )}
                    </div>
                  ) : null}

                  {ownerDetailTab === "questions" ? (
                    <div className="detail-tab-copy">
                      <span className="detail-label">Questions for the call</span>
                      {detail.questionsForCall.length ? (
                        <ol className="owner-tab-list">
                          {detail.questionsForCall.map((question) => (
                            <li key={question}>{question}</li>
                          ))}
                        </ol>
                      ) : (
                        <p>No call questions were saved.</p>
                      )}
                    </div>
                  ) : null}

                  {ownerDetailTab === "qualification" ? (
                    <div className="qualification-detail-grid">
                      <div>
                        <span className="detail-label">Fit assessment</span>
                        <p>{brief.fit}</p>
                        <p className="fit-disclaimer">
                          Color shows alignment with firm intake rules, not legal merit or likely
                          outcome.
                        </p>
                      </div>
                      <div>
                        <span className="detail-label">Why it scored this way</span>
                        {fitReasons.length ? (
                          <ul className="owner-tab-list">
                            {fitReasons.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>No fit reasons were saved.</p>
                        )}
                        {disqualifiers.length ? (
                          <>
                            <span className="detail-label secondary-label">Disqualifiers</span>
                            <ul className="owner-tab-list">
                              {disqualifiers.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </section>

                <footer className="decision-bar">
                  <div className="decision-copy">
                    <span className="detail-label">Human decision</span>
                    <p>
                      Acceptance, client communication, conflict clearance and legal assessment stay
                      human.
                    </p>
                    {!canReview ? (
                      <p className="review-note">
                        Reference records are read-only. Run a new inquiry to try these decisions.
                      </p>
                    ) : null}
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
                        Approve draft
                      </button>
                      <button
                        type="button"
                        disabled={!actionEnabled}
                        onClick={() => decide("edit")}
                      >
                        Save edited draft
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
                  <span>Model</span>
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
