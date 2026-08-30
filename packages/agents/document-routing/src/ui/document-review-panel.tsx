"use client";
import { useState } from "react";

function words(value: string) {
  return value.replaceAll("_", " ");
}

type DocumentDetail = {
  result: {
    id: string;
    status: string;
    confidence: number;
    request_draft: string | null;
    classification_json: {
      doc_type: string;
      evidence: Array<{ field: string; quote: string; page: number }>;
    };
    completeness_json: { missing: string[]; satisfied: string[] };
    routing_json: {
      matter_id: string | null;
      reviewer_role: string;
      priority: string;
      reason: string;
    };
  };
  document: { filename: string };
  matter: { matter_type: string; stage: string } | null;
  steps: Array<{ seq: number; name: string; note: string | null }>;
};

export function DocumentReviewPanel({
  detail,
  canReview,
}: {
  detail: DocumentDetail;
  canReview: boolean;
}) {
  const classification = detail.result.classification_json;
  const completeness = detail.result.completeness_json;
  const routing = detail.result.routing_json;
  const [status, setStatus] = useState(detail.result.status);
  const [message, setMessage] = useState(
    canReview ? "Confirm, correct or reject the proposal." : "Reference record is read-only.",
  );
  const [reviewerRole, setReviewerRole] = useState(routing.reviewer_role);
  const [priority, setPriority] = useState(routing.priority);
  async function decide(decision: "approve" | "edit" | "reject") {
    const reason = decision === "reject" ? window.prompt("Why is this wrong?") : undefined;
    if (decision === "reject" && !reason) return;
    setMessage("Saving human decision...");
    const response = await fetch(`/api/review/document/${detail.result.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        reason,
        matter_id: routing.matter_id,
        reviewer_role: reviewerRole,
        priority,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Review failed.");
      return;
    }
    setStatus(result.status);
    setMessage(
      result.routed ? "Approved and routed in the simulated workspace." : "Decision saved.",
    );
  }
  return (
    <main className="detail-main compact-detail">
      <section className="container">
        <div className="detail-title-row">
          <div>
            <p className="kicker">Agent 2 / Human review</p>
            <h1>{detail.document.filename}</h1>
          </div>
          <span className={`decision-chip ${routing.priority}`}>{words(routing.priority)}</span>
        </div>
        <div className="review-overview-grid">
          <article className="review-score-card">
            <span>Classification</span>
            <strong>{words(classification.doc_type)}</strong>
            <small>{Math.round(detail.result.confidence * 100)}% confidence</small>
          </article>
          <article>
            <span>Matched matter</span>
            <strong>
              {detail.matter
                ? `${words(detail.matter.matter_type)} / ${detail.matter.stage}`
                : "No match"}
            </strong>
            <small>{routing.reason}</small>
          </article>
          <article>
            <span>Route</span>
            <strong>{words(reviewerRole)}</strong>
            <small>{words(priority)} priority</small>
          </article>
          <article>
            <span>Completeness</span>
            <strong>{completeness.missing.length} missing</strong>
            <small>{completeness.satisfied.length} satisfied</small>
          </article>
        </div>
        <div className="compact-split">
          <section className="review-card">
            <h2>Evidence-backed fields</h2>
            <div className="evidence-table">
              {classification.evidence.map((item) => (
                <div key={`${item.field}-${item.page}-${item.quote}`}>
                  <b>{words(item.field)}</b>
                  <span>“{item.quote}”</span>
                  <small>p.{item.page}</small>
                </div>
              ))}
            </div>
          </section>
          <section className="review-card">
            <h2>Missing from checklist</h2>
            <div className="tag-list">
              {completeness.missing.map((item: string) => (
                <span key={item}>{words(item)}</span>
              ))}
            </div>
            <h3>Draft request</h3>
            <p>{detail.result.request_draft ?? "No follow-up needed."}</p>
          </section>
        </div>
        <details className="trace-disclosure">
          <summary>Technical trace ({detail.steps.length} steps)</summary>
          {detail.steps.map((step) => (
            <div className="trace-step" key={step.seq}>
              <b>
                {step.seq}. {words(step.name)}
              </b>
              <span>{step.note}</span>
            </div>
          ))}
        </details>
        <div className="sticky-review-bar">
          <div>
            <b>Status: {words(status)}</b>
            <span>{message}</span>
          </div>
          {canReview && status === "review" ? (
            <div className="review-actions">
              <label>
                Reviewer
                <select
                  value={reviewerRole}
                  onChange={(event) => setReviewerRole(event.target.value)}
                >
                  <option value="paralegal">Paralegal</option>
                  <option value="associate">Associate</option>
                  <option value="partner">Partner</option>
                  <option value="office_manager">Office manager</option>
                </select>
              </label>
              <label>
                Priority
                <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="needs_human">Needs human</option>
                </select>
              </label>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => decide("reject")}
              >
                Reject
              </button>
              <button type="button" className="button button-ghost" onClick={() => decide("edit")}>
                Save correction
              </button>
              <button type="button" className="button" onClick={() => decide("approve")}>
                Approve route
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
