export type AgentWorkflow = {
  heading: string;
  intro: string;
  businessFlow: readonly (readonly [string, string])[];
  technicalFlow: readonly (readonly [string, string])[];
  usesModel: boolean;
};

export function AgentWorkflowExplainer({ workflow }: { workflow: AgentWorkflow }) {
  return (
    <section className="agent-workflow" aria-labelledby="agent-workflow-title">
      <div className="container">
        <header className="workflow-heading">
          <div>
            <h2 id="agent-workflow-title">{workflow.heading}</h2>
          </div>
          <div className="workflow-heading-copy">
            <p>{workflow.intro}</p>
            <a className="text-link" href="#test-live">
              Test it live <span aria-hidden="true">→</span>
            </a>
          </div>
        </header>

        <ol className="business-flow" aria-label="Business workflow">
          {workflow.businessFlow.map(([title, description], index) => (
            <li key={title}>
              <span className="business-flow-number">0{index + 1}</span>
              <strong>{title}</strong>
              <small>{description}</small>
            </li>
          ))}
        </ol>

        <ul className="workflow-controls" aria-label="Client installation controls">
          <li>Your Supabase project</li>
          <li>No pooled client database</li>
          <li>Human approval before action</li>
          <li>{workflow.usesModel ? "Bounded model input" : "No model call needed"}</li>
        </ul>

        <details className="technical-wiring">
          <summary>
            <span>
              <strong>Under the hood</strong>
              <small>See the systems, storage and control points</small>
            </span>
            <i aria-hidden="true">+</i>
          </summary>
          <div className="technical-wiring-body">
            <p className="technical-wiring-label">Example client installation</p>
            <ol aria-label="Technical wiring">
              {workflow.technicalFlow.map(([title, description], index) => (
                <li key={title}>
                  <span>0{index + 1}</span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </li>
              ))}
            </ol>
            <p className="technical-wiring-note">
              Your operational data stays in your firm-owned database.{" "}
              {workflow.usesModel
                ? "Only the bounded fields needed for interpretation are sent to the approved model provider."
                : "This workflow runs on explicit rules and sends no client data to a model."}{" "}
              No final action happens until a named person approves it.
            </p>
            <a className="text-link technical-wiring-cta" href="#test-live">
              Test the full workflow <span aria-hidden="true">→</span>
            </a>
          </div>
        </details>
      </div>
    </section>
  );
}
