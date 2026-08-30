"use client";
import { useState } from "react";

const words = (value: string) => value.replaceAll("_", " ");
type StalledDetail = {
  report: {
    id: string;
    report_date: string;
    summary_md: string;
    items_json: { total?: number; high?: number; medium?: number; low?: number };
  };
  items: Array<{
    id: string;
    severity: string;
    kind: string;
    drafted_action: string;
    decision: string | null;
    evidence_json: Record<string, unknown> & { why?: string };
    matter: { matter_type: string; stage: string; contact: { name: string } | null } | null;
  }>;
  steps: Array<{ seq: number; name: string; note: string | null }>;
};

export function StalledReviewPanel({
  detail,
  canReview,
}: {
  detail: StalledDetail;
  canReview: boolean;
}) {
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [message, setMessage] = useState(
    canReview
      ? "Each action is independent; nothing sends automatically."
      : "Reference record is read-only.",
  );
  async function decide(id: string, decision: "approve" | "snooze_7d" | "dismiss") {
    const reason =
      decision === "dismiss" ? window.prompt("Why is this a false positive?") : undefined;
    if (decision === "dismiss" && !reason) return;
    const response = await fetch(`/api/review/stalled/item/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Decision failed.");
      return;
    }
    setDecisions((current) => ({ ...current, [id]: result.decision }));
    setMessage("Decision saved. Approved actions stay inside the simulated workspace.");
  }
  async function markReviewed() {
    const response = await fetch(`/api/review/stalled/report/${detail.report.id}`, {
      method: "POST",
    });
    const result = await response.json();
    setMessage(
      response.ok ? "Monday brief marked reviewed." : (result.error ?? "Could not mark reviewed."),
    );
  }
  const counts = detail.report.items_json;
  return (
    <main className="detail-main compact-detail">
      <section className="container">
        <div className="detail-title-row">
          <div>
            <p className="kicker">Agent 3 / Monday owner brief</p>
            <h1>{detail.report.report_date}</h1>
            <p>{detail.report.summary_md}</p>
          </div>
          {canReview ? (
            <button type="button" className="button" onClick={markReviewed}>
              Mark brief reviewed
            </button>
          ) : null}
        </div>
        <div className="review-overview-grid">
          <article>
            <span>Total</span>
            <strong>{counts.total ?? detail.items.length}</strong>
            <small>open detections</small>
          </article>
          <article className="severity-high">
            <span>High</span>
            <strong>{counts.high ?? 0}</strong>
            <small>review first</small>
          </article>
          <article className="severity-medium">
            <span>Medium</span>
            <strong>{counts.medium ?? 0}</strong>
            <small>needs attention</small>
          </article>
          <article>
            <span>Low</span>
            <strong>{counts.low ?? 0}</strong>
            <small>monitor</small>
          </article>
        </div>
        <div className="stalled-list">
          {detail.items.map((item, index) => {
            const savedDecision = decisions[item.id] ?? item.decision;
            return (
              <details className="stalled-card" key={item.id} open={index === 0}>
                <summary className="stalled-card-summary">
                  <div className="stalled-card-heading">
                    <div className="stalled-card-tags">
                      <span className={`decision-chip ${item.severity}`}>{item.severity}</span>
                      <span className="issue-chip">{words(item.kind)}</span>
                      {savedDecision ? (
                        <span className="issue-chip decision-saved">{words(savedDecision)}</span>
                      ) : null}
                    </div>
                    <h2>
                      {item.matter?.contact?.name ?? words(item.matter?.matter_type ?? "matter")}
                    </h2>
                    <p>
                      {words(item.matter?.matter_type ?? "matter")} · {item.matter?.stage}
                    </p>
                  </div>
                  <span className="stalled-card-toggle" aria-hidden="true" />
                </summary>
                <div className="stalled-card-detail">
                  <div>
                    <b>Why it surfaced</b>
                    <p>
                      {item.evidence_json.why ??
                        `The ${words(item.kind)} rule met its stored threshold.`}
                    </p>
                    <small>
                      {Object.entries(item.evidence_json)
                        .filter(
                          ([key]) =>
                            !["why", "recommended_action", "owner_role", "confidence"].includes(
                              key,
                            ),
                        )
                        .slice(0, 4)
                        .map(([key, value]) => `${words(key)}: ${String(value)}`)
                        .join(" · ")}
                    </small>
                  </div>
                  <div>
                    <b>Drafted action</b>
                    <p>{item.drafted_action}</p>
                  </div>
                  <div className="item-actions">
                    {savedDecision ? (
                      <span className="item-decision">{words(savedDecision)}</span>
                    ) : canReview ? (
                      <>
                        <button
                          type="button"
                          className="item-action item-action-muted"
                          onClick={() => decide(item.id, "dismiss")}
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          className="item-action item-action-secondary"
                          onClick={() => decide(item.id, "snooze_7d")}
                        >
                          Snooze 7d
                        </button>
                        <button
                          type="button"
                          className="item-action item-action-primary"
                          onClick={() => decide(item.id, "approve")}
                        >
                          Approve
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
        <details className="trace-disclosure">
          <summary>
            {detail.steps.length
              ? `Technical trace (${detail.steps.length} steps)`
              : "Reference snapshot details"}
          </summary>
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
            <b>Human boundary</b>
            <span>{message}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
