import Link from "next/link";

type VerticalOverviewPageProps = {
  name: "Accounting" | "Logistics";
  audience: string;
  businessProblem: string;
};

const standards = [
  {
    number: "01",
    title: "One valuable job",
    description:
      "Each agent owns a narrow workflow with a clear input, output and business result.",
  },
  {
    number: "02",
    title: "Inspectable work",
    description:
      "Every demo shows the records, rules, checks and evidence behind the prepared work.",
  },
  {
    number: "03",
    title: "Human authority",
    description: "A person reviews the result and keeps control over every consequential action.",
  },
] as const;

export function VerticalOverviewPage({
  name,
  audience,
  businessProblem,
}: VerticalOverviewPageProps) {
  const slug = name.toLowerCase();

  return (
    <div className="site-shell overview-shell">
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
          <Link className="button button-small header-cta" href="/">
            All verticals
          </Link>
          <details className="mobile-menu">
            <summary aria-label="Open navigation">
              <i />
              <i />
            </summary>
            <nav aria-label="Mobile navigation">
              <Link aria-current={name === "Accounting" ? "page" : undefined} href="/accounting">
                Accounting
              </Link>
              <Link href="/legal">Legal</Link>
              <Link aria-current={name === "Logistics" ? "page" : undefined} href="/logistics">
                Logistics
              </Link>
              <Link className="button" href="/">
                All verticals
              </Link>
            </nav>
          </details>
        </div>
      </header>

      <main>
        <section className="overview-hero" aria-labelledby={`${slug}-title`}>
          <div className="container overview-hero-grid">
            <div>
              <p className="kicker">Automutiny / {name}</p>
              <h1 id={`${slug}-title`}>
                {name} agents for {audience}.
              </h1>
              <p className="overview-lead">{businessProblem}</p>
              <div className="hero-actions">
                <a className="button" href="#agent-standard">
                  See the agent standard
                </a>
                <Link className="text-link" href="/legal">
                  Explore the legal team <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <aside className="overview-brief" aria-label={`${name} agent standard`}>
              <div className="overview-brief-head">
                <span>{name} agent standard</span>
                <strong>Human controlled</strong>
              </div>
              <dl>
                <div>
                  <dt>Scope</dt>
                  <dd>Narrow business workflows</dd>
                </div>
                <div>
                  <dt>Evidence</dt>
                  <dd>Inputs, rules, checks and trace</dd>
                </div>
                <div>
                  <dt>Control</dt>
                  <dd>Human review before action</dd>
                </div>
              </dl>
              <p>Agents prepare the work. People retain the authority.</p>
            </aside>
          </div>
        </section>

        <section
          className="section overview-standard"
          id="agent-standard"
          aria-labelledby="standard-title"
        >
          <div className="container">
            <div className="split-head">
              <div>
                <p className="kicker">Inside every demo</p>
                <h2 id="standard-title">The same standard across every agent.</h2>
              </div>
              <p>
                The workflows change by industry. The rules, evidence trail and human boundary stay
                consistent.
              </p>
            </div>
            <div className="overview-standard-grid">
              {standards.map((standard) => (
                <article key={standard.title}>
                  <span>{standard.number}</span>
                  <h3>{standard.title}</h3>
                  <p>{standard.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="overview-portfolio-strip">
          <div className="container">
            <div>
              <span>Agent portfolio</span>
              <strong>Accounting, Legal and Logistics</strong>
            </div>
            <p>Focused agents, visible evidence and human control across every vertical.</p>
            <Link className="button button-small" href="/">
              View all verticals
            </Link>
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
