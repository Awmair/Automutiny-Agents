import { getAgentQueueSummaries } from "@automutiny/db";
import { documentRoutingAgent } from "@automutiny/document-routing-agent";
import { intakeBriefAgent } from "@automutiny/intake-brief-agent";
import { stalledWorkAgent } from "@automutiny/stalled-work-agent";
import Link from "next/link";
import { configuredFirmName } from "../lib/config";

const agents = [intakeBriefAgent, documentRoutingAgent, stalledWorkAgent];

export const dynamic = "force-dynamic";

const operatingSteps = [
  ["Read", "Load the firm rules and the relevant matter records."],
  ["Prepare", "Apply deterministic rules before asking a model for judgment."],
  ["Check", "Validate the output, confidence, safety and run cost."],
  ["Explain", "Save the result and every inspectable trace step."],
  ["Decide", "Place the work in a queue for a human decision."],
] as const;

const controlPrinciples = [
  ["Rules before prompts", "Each agent begins with the firm's written rules and matter context."],
  ["Trace before action", "Every output keeps the inputs, checks and reasoning path visible."],
  ["Human before consequence", "The agent prepares the work. A person owns the legal decision."],
] as const;

export default async function HomePage() {
  const firmName = configuredFirmName();
  const queueSummaries = await getAgentQueueSummaries();
  const summaryByAgent = new Map(queueSummaries.map((summary) => [summary.agentId, summary]));

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="Automutiny legal operations agents home">
            <span className="brand-mark" aria-hidden="true">
              <i />
            </span>
            <span className="brand-type">
              <b>auto</b>
              <i />
              <strong>mutiny</strong>
            </span>
          </a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#agents">Agents</a>
            <a href="#process">Operating pattern</a>
            <a href="#controls">Firm controls</a>
            <Link href="/failures">Failure lab</Link>
          </nav>
          <a className="button button-small header-cta" href="#agents">
            Meet the team
          </a>
          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <i />
              <i />
            </summary>
            <nav aria-label="Mobile navigation">
              <a href="#agents">Agents</a>
              <a href="#process">Operating pattern</a>
              <a href="#controls">Firm controls</a>
              <Link href="/failures">Failure lab</Link>
              <a className="button" href="#agents">
                Meet the team
              </a>
            </nav>
          </details>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-cloud" aria-hidden="true" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="kicker">Automutiny × {firmName}</p>
              <h1 id="hero-title">Three legal agents. Real work. Human authority.</h1>
              <p className="hero-lead">
                Three specialist agents prepare firm work, show their evidence and stop before a
                human decision.
              </p>
              <div className="hero-actions">
                <a className="button" href="#agents">
                  Explore the agents
                </a>
                <a className="text-link" href="#process">
                  See how they connect <span aria-hidden="true">→</span>
                </a>
              </div>
              <section className="hero-points" aria-label="System summary">
                <div>
                  <strong>3</strong>
                  <span>specialist agents</span>
                </div>
                <div>
                  <strong>1</strong>
                  <span>shared safety system</span>
                </div>
                <div>
                  <strong>5</strong>
                  <span>inspectable steps</span>
                </div>
              </section>
            </div>

            <section className="agent-console" aria-label="Legal agent overview">
              <div className="console-topline">
                <span>Legal agents / live view</span>
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
                      {summaryByAgent.get(agent.id)?.awaitingReview ?? 0} for human review ·{" "}
                      {summaryByAgent.get(agent.id)?.total ?? 0} in queue
                    </small>
                  </Link>
                ))}
              </div>
              <div className="console-footer">
                <span>Firm rules loaded</span>
                <span>Trace recording on</span>
                <span>Actions locked</span>
              </div>
            </section>
          </div>
        </section>

        <aside className="fit-strip">
          <div className="container">
            <p>
              Built to prepare work, preserve evidence and return every consequential choice to the
              firm.
            </p>
          </div>
        </aside>

        <section className="section agents-section" id="agents" aria-labelledby="agents-title">
          <div className="container">
            <div className="split-head">
              <div>
                <p className="kicker">The agent team</p>
                <h2 id="agents-title">Three specialists. One standard of control.</h2>
              </div>
              <p>
                Each agent owns one narrow preparation job. They share the same firm rules, evidence
                trail and human-review boundary.
              </p>
            </div>

            <div className="agent-grid">
              {agents.map((agent, index) => (
                <Link className="agent-card" href={agent.route} key={agent.id}>
                  <div className="agent-card-head">
                    <span>0{index + 1}</span>
                    <span>{agent.label}</span>
                  </div>
                  <h3>{agent.name}</h3>
                  <p className="agent-purpose">{agent.purpose}</p>
                  <div className="agent-record">
                    <div>
                      <span>Reads</span>
                      <p>Firm rules + matter records</p>
                    </div>
                    <div>
                      <span>Produces</span>
                      <p>Review-ready preparation</p>
                    </div>
                  </div>
                  <div className="agent-queue-count">
                    <strong>{summaryByAgent.get(agent.id)?.total ?? 0}</strong>
                    <span>
                      items in queue · {summaryByAgent.get(agent.id)?.awaitingReview ?? 0} need
                      review
                    </span>
                  </div>
                  <div className="human-boundary">
                    <span>What stays human</span>
                    <p>{agent.humanBoundary}</p>
                  </div>
                  <span className="agent-card-open">Open agent queue →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          className="section dark process-section"
          id="process"
          aria-labelledby="process-title"
        >
          <div className="container">
            <div className="split-head">
              <div>
                <p className="kicker">Shared operating pattern</p>
                <h2 id="process-title">One path makes every run explainable.</h2>
              </div>
              <p>
                ELI5: records go in, firm rules narrow the choices, the agent prepares an answer,
                checks it and hands it to a person.
              </p>
            </div>

            <section className="connection-map" aria-label="System connection map">
              <div className="connection-source">
                <span>01 / Source</span>
                <strong>Firm records</strong>
                <p>Inquiries, documents, matters and written operating rules.</p>
              </div>
              <div className="connection-line" aria-hidden="true">
                <span>→</span>
              </div>
              <div className="connection-core">
                <span>02 / Intelligence layer</span>
                <strong>Agent runtime</strong>
                <p>Applies rules, calls the model where judgment helps and records the trace.</p>
              </div>
              <div className="connection-line" aria-hidden="true">
                <span>→</span>
              </div>
              <div className="connection-human">
                <span>03 / Control</span>
                <strong>Human review</strong>
                <p>Approves, changes or rejects the prepared work before any consequence.</p>
              </div>
            </section>

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

        <section
          className="section controls-section"
          id="controls"
          aria-labelledby="controls-title"
        >
          <div className="container controls-grid">
            <div>
              <p className="kicker">Firm controls</p>
              <h2 id="controls-title">Designed to stop at the right moment.</h2>
              <p className="controls-lead">
                The useful part is not just what the agents can do. It is knowing what they cannot
                do without the firm.
              </p>
            </div>
            <div className="principle-list">
              {controlPrinciples.map(([title, description], index) => (
                <article key={title}>
                  <span>0{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-cloud" aria-hidden="true" />
        <div className="container footer-grid">
          <div className="footer-intro">
            <a className="footer-brand" href="#top">
              Automutiny Legal Operations Agents
            </a>
            <p>An inspectable agent system for {firmName}. Agents prepare. Humans decide.</p>
            <a className="button footer-button" href="#agents">
              Review the agents
            </a>
          </div>
          <nav aria-label="Agent links">
            <strong>Agent team</strong>
            {agents.map((agent) => (
              <Link href={agent.route} key={agent.id}>
                {agent.name}
              </Link>
            ))}
          </nav>
          <nav aria-label="System links">
            <strong>System</strong>
            <a href="#process">Operating pattern</a>
            <a href="#controls">Firm controls</a>
            <Link href="/failures">Failure lab</Link>
            <a href="https://automutiny.com">Automutiny.com</a>
          </nav>
        </div>
        <div className="container footer-meta">
          <span>{firmName} agent system</span>
          <span>Every legal judgment and final action stays human.</span>
        </div>
      </footer>
    </div>
  );
}
