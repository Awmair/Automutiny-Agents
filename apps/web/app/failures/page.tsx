import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

const failures = [
  {
    agent: "Intake brief",
    failure: "Prompt injection inside an inquiry",
    signal: "Untrusted instructions in record text",
    outcome: "Ignored as instructions; brief remains review-only",
    status: "Contained",
  },
  {
    agent: "Document routing",
    failure: "Ambiguous matter match",
    signal: "Insufficient grounded evidence",
    outcome: "No automatic route; owner must confirm the matter",
    status: "Held",
  },
  {
    agent: "Stalled work",
    failure: "Invalid model JSON or timeout",
    signal: "Schema or provider failure",
    outcome: "Run fails closed; no partial owner brief is shown",
    status: "Failed safe",
  },
] as const;

export default function FailuresPage() {
  return (
    <main className="failure-page">
      <div className="container">
        <Link className="failure-back" href="/legal">
          ← Legal agents
        </Link>
        <header className="failure-head">
          <div>
            <h1>When the agent is uncertain, the system gets quieter.</h1>
          </div>
          <p>
            Controlled pressure and red-team cases verify that uncertainty becomes review or a
            visible failure, never a hidden action.
          </p>
        </header>
        <section className="failure-grid" aria-label="Curated safe failures">
          {failures.map((item) => (
            <article className="failure-card" key={item.failure}>
              <div className="failure-card-top">
                <span>{item.agent}</span>
                <strong>{item.status}</strong>
              </div>
              <h2>{item.failure}</h2>
              <dl>
                <div>
                  <dt>Detected by</dt>
                  <dd>{item.signal}</dd>
                </div>
                <div>
                  <dt>Safe result</dt>
                  <dd>{item.outcome}</dd>
                </div>
              </dl>
            </article>
          ))}
        </section>
        <div className="failure-evidence">
          <span>Release evidence</span>
          <strong>45 pressure cases · 40 red-team cases</strong>
          <p>All committed contract cases currently pass.</p>
        </div>
      </div>
    </main>
  );
}
