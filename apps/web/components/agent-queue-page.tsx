import type { AgentQueue } from "@automutiny/db";
import Link from "next/link";
import type { ReactNode } from "react";

type AgentDetails = {
  label: string;
  name: string;
  purpose: string;
  humanBoundary: string;
};

function ageLabel(createdAt: string) {
  const elapsed = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const hours = Math.floor(elapsed / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function confidenceLabel(confidence: number | null) {
  return confidence === null ? "Not scored" : `${Math.round(confidence * 100)}%`;
}

export function AgentQueuePage({
  agent,
  queue,
  children,
}: {
  agent: AgentDetails;
  queue: AgentQueue;
  children?: ReactNode;
}) {
  return (
    <div className="site-shell queue-site-shell">
      <header className="site-header">
        <div className="header-inner queue-header-inner">
          <Link className="brand" href="/" aria-label="Automutiny agents home">
            <span className="brand-mark" aria-hidden="true">
              <i />
            </span>
            <span className="brand-type">
              <b>auto</b>
              <i />
              <strong>mutiny</strong>
            </span>
          </Link>
          <span className="queue-firm">Briar &amp; Calder LLP</span>
          <Link className="button button-small" href="/">
            All agents
          </Link>
        </div>
      </header>

      <main className="queue-main">
        <section className="queue-hero">
          <div className="container queue-hero-grid">
            <div>
              <p className="kicker">{agent.label} / Live queue</p>
              <h1>{agent.name}</h1>
              <p className="queue-lead">{agent.purpose}</p>
            </div>
            <aside className="queue-boundary">
              <span>What stays human</span>
              <p>{agent.humanBoundary}</p>
            </aside>
          </div>
        </section>

        {children}

        <section className="queue-workspace" aria-labelledby="queue-title">
          <div className="container">
            <div className="queue-summary">
              <div>
                <p className="kicker">Current work</p>
                <h2 id="queue-title">Items waiting in this agent’s lane.</h2>
              </div>
              <div className="queue-metrics">
                <div>
                  <strong>{queue.items.length}</strong>
                  <span>in queue</span>
                </div>
                <div>
                  <strong>{queue.awaitingReview}</strong>
                  <span>need human review</span>
                </div>
              </div>
            </div>

            <div className="queue-table">
              <table aria-label={`${agent.name} queue`}>
                <thead>
                  <tr className="queue-row queue-table-head">
                    <th scope="col">Subject</th>
                    <th scope="col">Agent summary</th>
                    <th scope="col">Confidence</th>
                    <th scope="col">Age</th>
                    <th scope="col">Status</th>
                    <th scope="col">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.items.map((item) => (
                    <tr className="queue-row" key={item.id}>
                      <th scope="row">
                        <strong className="queue-subject">{item.subject}</strong>
                      </th>
                      <td>
                        <p className="queue-item-summary">{item.summary}</p>
                      </td>
                      <td>
                        <span className="confidence-pill">{confidenceLabel(item.confidence)}</span>
                      </td>
                      <td>
                        <span className="queue-age">{ageLabel(item.createdAt)}</span>
                      </td>
                      <td>
                        <span className="queue-status">{item.status}</span>
                      </td>
                      <td>
                        {item.href ? (
                          <Link className="queue-open-link" href={item.href}>
                            View →
                          </Link>
                        ) : (
                          <span className="queue-open-muted">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="queue-connection">
          <div className="container queue-connection-grid">
            <span>How it connects</span>
            <p>
              Supabase stores the firm records. The server reads only this agent’s lane and turns it
              into the queue above. Completed rows open this agent’s compact owner view and
              inspectable run trace.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
