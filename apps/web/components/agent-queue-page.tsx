import type { AgentQueue } from "@automutiny/db";
import Link from "next/link";
import type { ReactNode } from "react";
import { absoluteUrl, ORGANIZATION_ID, WEBSITE_ID } from "../lib/seo";
import { StructuredData } from "./structured-data";

type AgentDetails = {
  id: string;
  label: string;
  name: string;
  purpose: string;
  humanBoundary: string;
  route: `/${string}`;
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
  organizationLabel = "Briar & Calder LLP",
  backHref = "/legal",
  backLabel = "Legal agents",
  liveTestHref,
}: {
  agent: AgentDetails;
  queue: AgentQueue;
  children?: ReactNode;
  organizationLabel?: string;
  backHref?: string;
  backLabel?: string;
  liveTestHref?: string;
}) {
  return (
    <div className="site-shell queue-site-shell">
      <StructuredData
        id={`${agent.id}-software-schema`}
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "@id": `${absoluteUrl(agent.route)}#software`,
          name: agent.name,
          url: absoluteUrl(agent.route),
          description: agent.purpose,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          isPartOf: { "@id": WEBSITE_ID },
          publisher: { "@id": ORGANIZATION_ID },
          audience: { "@type": "BusinessAudience", audienceType: organizationLabel },
          featureList: [agent.purpose, `Human review boundary: ${agent.humanBoundary}`],
        }}
      />
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
          <span className="queue-firm">{organizationLabel}</span>
          <Link className="button button-small" href={backHref}>
            {backLabel}
          </Link>
        </div>
      </header>

      <main className="queue-main">
        <section className="queue-hero">
          <div className="container queue-hero-grid">
            <div>
              <h1>{agent.name}</h1>
              <p className="queue-lead">{agent.purpose}</p>
              {liveTestHref ? (
                <div className="queue-hero-actions">
                  <a className="button" href={liveTestHref}>
                    Test it live
                  </a>
                  <a className="text-link" href="#queue-title">
                    View the live queue <span aria-hidden="true">→</span>
                  </a>
                </div>
              ) : null}
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
                <h2 id="queue-title">Items waiting in this agent’s lane.</h2>
              </div>
              <div className="queue-summary-actions">
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
                {liveTestHref ? (
                  <a className="button button-small" href={liveTestHref}>
                    Test it live
                  </a>
                ) : null}
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
          <div className={`container queue-connection-grid${liveTestHref ? " has-live-cta" : ""}`}>
            <span>How it connects</span>
            <p>
              Supabase stores the workflow records. The server reads only this agent’s lane and
              turns it into the queue above. Completed rows open this agent’s compact owner view and
              inspectable run trace.
            </p>
            {liveTestHref ? (
              <a className="button button-small queue-connection-cta" href={liveTestHref}>
                Test it live
              </a>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
