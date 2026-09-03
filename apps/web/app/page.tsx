import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "AI Agents for Accounting, Legal and Logistics | Automutiny",
  },
  description:
    "Explore nine live AI agents for accounting firms, law firms and logistics teams. Test focused workflows with visible evidence and human approval.",
  alternates: { canonical: "/" },
};

const verticals = [
  {
    slug: "accounting",
    number: "01",
    name: "Accounting",
    audience: "Accounting, CPA and tax firms",
    description:
      "Narrow agents for repetitive firm work where speed, accuracy and a clear review trail matter.",
    details: ["Focused firm workflows", "Inspectable evidence", "Human sign-off"],
  },
  {
    slug: "legal",
    number: "02",
    name: "Legal",
    audience: "Law firms",
    description:
      "A working legal agent team for intake preparation, document routing and stalled matter review.",
    details: ["Intake brief", "Document routing", "Stalled work"],
  },
  {
    slug: "logistics",
    number: "03",
    name: "Logistics",
    audience: "Freight, logistics and transportation companies",
    description:
      "Focused agents for operational work where delays, missed follow-up and manual handoffs cost revenue.",
    details: ["Focused operations workflows", "Visible exceptions", "Human dispatch control"],
  },
] as const;

const standards = [
  {
    number: "01",
    title: "Narrow by design",
    description: "One agent owns one clear job. No bloated assistant trying to do everything.",
  },
  {
    number: "02",
    title: "Cost controlled",
    description:
      "Rules and software handle predictable work. Models are used only where judgment helps.",
  },
  {
    number: "03",
    title: "Human governed",
    description:
      "The agent prepares and explains. A person keeps authority over every consequence.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="site-shell hub-shell">
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="Automutiny agents home">
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
            <Link href="/accounting">Accounting</Link>
            <Link href="/legal">Legal</Link>
            <Link href="/logistics">Logistics</Link>
          </nav>
          <a className="button button-small header-cta" href="#verticals">
            Test live agents
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
              <a className="button" href="#verticals">
                Test live agents
              </a>
            </nav>
          </details>
        </div>
      </header>

      <main id="top">
        <section className="hub-hero" aria-labelledby="hub-title">
          <div className="hub-atmosphere" aria-hidden="true" />
          <div className="container hub-hero-grid">
            <div className="hub-copy">
              <h1 id="hub-title">
                AI agents for real business workflows.
                <span>Humans stay in control.</span>
              </h1>
              <p className="hub-lead">
                Explore nine focused agents for repetitive operational work. Each one prepares the
                task, shows its evidence and stops before a consequential decision.
              </p>
              <div className="hero-actions">
                <a className="button" href="#verticals">
                  Choose an agent
                </a>
                <a className="text-link" href="#standard">
                  See our build standard <span aria-hidden="true">→</span>
                </a>
              </div>
              <section className="hub-proof" aria-label="Build principles">
                <span>Narrow scope</span>
                <span>Measured cost</span>
                <span>Human authority</span>
              </section>
            </div>

            <section className="work-flow-visual" aria-label="How a focused AI agent works">
              <div className="flow-track" aria-hidden="true">
                <i />
              </div>
              <ol>
                <li className="flow-work">
                  <span className="flow-icon" aria-hidden="true">
                    ↻
                  </span>
                  <strong>Repetitive work</strong>
                  <small>Collect · sort · check</small>
                </li>
                <li className="flow-agent">
                  <span className="flow-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <title>AI agent</title>
                      <rect x="6" y="6" width="12" height="12" rx="3" />
                      <circle cx="12" cy="12" r="2.5" />
                      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
                    </svg>
                  </span>
                  <strong>AI agent</strong>
                  <small>Prepares and explains</small>
                </li>
                <li className="flow-review">
                  <span className="flow-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <title>Human review</title>
                      <circle cx="8.5" cy="8" r="3" />
                      <path d="M3.5 19c.7-3.3 2.5-5 5-5 1.4 0 2.6.5 3.5 1.4M14.5 17l2.2 2.2 4-5" />
                    </svg>
                  </span>
                  <strong>Human review</strong>
                  <small>Approve · edit · reject</small>
                </li>
                <li className="flow-done">
                  <span className="flow-icon" aria-hidden="true">
                    ✓
                  </span>
                  <strong>Done</strong>
                  <small>Decision recorded</small>
                </li>
              </ol>
            </section>
          </div>
        </section>

        <aside className="fit-strip hub-fit-strip">
          <div className="container">
            <p>
              We publish agents after the workflow is understood, the cost is measured and the human
              boundary is visible.
            </p>
          </div>
        </aside>

        <section
          className="section verticals-section"
          id="verticals"
          aria-labelledby="verticals-title"
        >
          <div className="container">
            <div className="split-head">
              <div>
                <h2 id="verticals-title">Choose the business you know.</h2>
              </div>
              <p>
                Each vertical gets its own focused agent team, workflow demos and inspectable proof.
              </p>
            </div>

            <div className="vertical-grid">
              {verticals.map((vertical) => (
                <Link className="vertical-card" href={`/${vertical.slug}`} key={vertical.slug}>
                  <div className="vertical-card-top">
                    <span>
                      {vertical.number} / {vertical.name}
                    </span>
                  </div>
                  <p className="vertical-audience">{vertical.audience}</p>
                  <h3>{vertical.description}</h3>
                  <ul>
                    {vertical.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  <span className="vertical-card-open">
                    Explore {vertical.name.toLowerCase()}
                    <i aria-hidden="true">→</i>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section
          className="section dark hub-standard"
          id="standard"
          aria-labelledby="standard-title"
        >
          <div className="container">
            <div className="split-head">
              <div>
                <h2 id="standard-title">Useful before impressive.</h2>
              </div>
              <p>
                ELI5: give each agent one valuable job, use the cheapest reliable method, show its
                work and stop before a human decision.
              </p>
            </div>

            <div className="standard-grid">
              {standards.map((standard) => (
                <article key={standard.title}>
                  <span>{standard.number}</span>
                  <h3>{standard.title}</h3>
                  <p>{standard.description}</p>
                </article>
              ))}
            </div>

            <section className="hub-workflow" aria-label="Agent workflow">
              <span>Business records</span>
              <i aria-hidden="true">→</i>
              <span>Written rules</span>
              <i aria-hidden="true">→</i>
              <span>Narrow agent</span>
              <i aria-hidden="true">→</i>
              <span>Human review</span>
            </section>
          </div>
        </section>
      </main>

      <footer className="site-footer hub-footer">
        <div className="footer-cloud" aria-hidden="true" />
        <div className="container footer-grid">
          <div className="footer-intro">
            <a className="footer-brand" href="#top">
              Automutiny Agents
            </a>
            <p>Lean, cost-controlled agents that do real work and return authority to humans.</p>
            <a className="button footer-button" href="#verticals">
              Test live agents
            </a>
          </div>
          <nav aria-label="Industry links">
            <strong>Industries</strong>
            <Link href="/accounting">Accounting</Link>
            <Link href="/legal">Legal</Link>
            <Link href="/logistics">Logistics</Link>
          </nav>
          <nav aria-label="Company links">
            <strong>Automutiny</strong>
            <a href="https://automutiny.com">Main website</a>
            <a href="#verticals">Agent demos</a>
          </nav>
        </div>
        <div className="container footer-meta">
          <span>Automutiny Agents</span>
          <span>Agents prepare. Humans decide.</span>
        </div>
      </footer>
    </div>
  );
}
