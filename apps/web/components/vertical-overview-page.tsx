import type { AgentQueueId, AgentQueueSummary } from "@automutiny/db";
import Link from "next/link";

type AgentDetails = {
  id: AgentQueueId;
  label: string;
  name: string;
  purpose: string;
  humanBoundary: string;
  route: `/${string}`;
};

type VerticalOverviewPageProps = {
  name: "Accounting" | "Logistics";
  audience: string;
  businessProblem: string;
  agents: readonly AgentDetails[];
  queueSummaries: AgentQueueSummary[];
};

const operatingSteps = [
  ["Read", "Load one bounded set of business records."],
  ["Check", "Apply written operating rules to the records."],
  ["Prepare", "Build a compact result and suggested next step."],
  ["Explain", "Save the evidence and the full run trace."],
  ["Decide", "Stop for a human approval, edit or rejection."],
] as const;

export function VerticalOverviewPage({
  name,
  audience,
  businessProblem,
  agents,
  queueSummaries,
}: VerticalOverviewPageProps) {
  const slug = name.toLowerCase();
  const summaryByAgent = new Map(queueSummaries.map((summary) => [summary.agentId, summary]));

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
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
          <nav className="desktop-nav" aria-label="Primary navigation">
            <Link aria-current={name === "Accounting" ? "page" : undefined} href="/accounting">
              Accounting
            </Link>
            <Link href="/legal">Legal</Link>
            <Link aria-current={name === "Logistics" ? "page" : undefined} href="/logistics">
              Logistics
            </Link>
          </nav>
          <a className="button button-small header-cta" href="#agents">
            View agents
          </a>
          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <i />
              <i />
            </summary>
            <nav aria-label="Mobile navigation">
              <Link href="/accounting">Accounting</Link>
              <Link href="/legal">Legal</Link>
              <Link href="/logistics">Logistics</Link>
              <a className="button" href="#agents">
                View agents
              </a>
            </nav>
          </details>
        </div>
      </header>

      <main>
        <section className="hero vertical-agent-hero" aria-labelledby={`${slug}-title`}>
          <div className="hero-cloud" aria-hidden="true" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="kicker">Automutiny / {name}</p>
              <h1 id={`${slug}-title`}>
                Three {name.toLowerCase()} agents. Real work. Human authority.
              </h1>
              <p className="hero-lead">{businessProblem}</p>
              <div className="hero-actions">
                <a className="button" href="#agents">
                  Explore the agents
                </a>
                <a className="text-link" href="#process">
                  See the complete workflow <span aria-hidden="true">→</span>
                </a>
              </div>
              <section className="hero-points" aria-label="System summary">
                <div>
                  <strong>3</strong>
                  <span>specialist agents</span>
                </div>
                <div>
                  <strong>1</strong>
                  <span>shared control system</span>
                </div>
                <div>
                  <strong>0</strong>
                  <span>automatic final actions</span>
                </div>
              </section>
            </div>

            <section className="agent-console" aria-label={`${name} agent overview`}>
              <div className="console-topline">
                <span>{name} agents / live view</span>
                <span className="system-state">Human controlled</span>
              </div>
              <div className="console-flow">
                {agents.map((agent, index) => (
                  <Link className="console-agent" href={agent.route} key={agent.id}>
                    <div>
                      <span className="console-number">0{index + 1}</span>
                      <span className="console-status">Ready</span>
                    </div>
                    <h2>{agent.name}</h2>
                    <p>{agent.purpose}</p>
                    <small>
                      {summaryByAgent.get(agent.id)?.awaitingReview ?? 0} for review · complete
                      workflow
                    </small>
                  </Link>
                ))}
              </div>
              <div className="console-footer">
                <span>Rules loaded</span>
                <span>Trace recording on</span>
                <span>Actions locked</span>
              </div>
            </section>
          </div>
        </section>

        <aside className="fit-strip">
          <div className="container">
            <p>
              Built for {audience}. Each agent handles one expensive operational bottleneck and
              shows its work.
            </p>
          </div>
        </aside>

        <section
          className="section agents-section"
          id="agents"
          aria-labelledby={`${slug}-agents-title`}
        >
          <div className="container">
            <div className="split-head">
              <div>
                <p className="kicker">The agent team</p>
                <h2 id={`${slug}-agents-title`}>Three specialists. One standard of control.</h2>
              </div>
              <p>
                Run a scenario, inspect the result, open the trace and make the final decision
                yourself.
              </p>
            </div>
            <div className="agent-grid">
              {agents.map((agent, index) => {
                const summary = summaryByAgent.get(agent.id);
                return (
                  <Link className="agent-card compact-agent-card" href={agent.route} key={agent.id}>
                    <div className="agent-card-head">
                      <span>0{index + 1}</span>
                      <span>{agent.label}</span>
                    </div>
                    <h3>{agent.name}</h3>
                    <p className="agent-purpose">{agent.purpose}</p>
                    <div className="agent-record">
                      <div>
                        <span>Runs</span>
                        <p>Bounded operational records</p>
                      </div>
                      <div>
                        <span>Produces</span>
                        <p>Review-ready action</p>
                      </div>
                    </div>
                    <div className="agent-queue-count">
                      <strong>{summary?.total ?? 0}</strong>
                      <span>reference items · {summary?.awaitingReview ?? 0} for review</span>
                    </div>
                    <div className="human-boundary">
                      <span>What stays human</span>
                      <p>{agent.humanBoundary}</p>
                    </div>
                    <span className="agent-card-open">Run full workflow →</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="section dark process-section"
          id="process"
          aria-labelledby={`${slug}-process-title`}
        >
          <div className="container">
            <div className="split-head">
              <div>
                <p className="kicker">Complete workflow</p>
                <h2 id={`${slug}-process-title`}>
                  Every demo runs from records to a saved human decision.
                </h2>
              </div>
              <p>
                ELI5: records go in, rules find the issue, the agent prepares the work, and a person
                decides what happens.
              </p>
            </div>
            <ol className="step-grid">
              {operatingSteps.map(([title, description], index) => (
                <li key={title}>
                  <span>0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="site-footer overview-footer">
        <div className="container footer-meta">
          <span>Automutiny {name} Agents</span>
          <span>Agents prepare. Humans decide.</span>
        </div>
      </footer>
    </div>
  );
}
