# Automutiny Agents specification

## 1. Purpose

Automutiny Agents is a human-reviewed AI agent system for professional-services work. The current legal-services vertical contains three agents:

1. Intake Brief
2. Document Intake and Routing
3. Stalled Work and Monday Brief

These agents have been deployed in real business workflows. Public records and screenshots are anonymized to protect client privacy.

The operating rule is simple: agents prepare, humans decide. An agent may gather records, apply rules, call the configured model, validate output, and prepare a review item. It cannot send a message, accept a client, make a legal decision, route a real document, close work, or change an external system on its own.

## 2. System map

```text
Visitor or owner
  -> Next.js dashboard
  -> Server route
  -> Labelled agent package
  -> Firm rules and Supabase records
  -> Deterministic checks
  -> Structured Groq call when judgment helps
  -> Zod validation and safety guards
  -> Agent result and inspectable trace
  -> Human review
  -> Simulated outbox
```

ELI5: Supabase holds the work, each agent is a focused worker, Groq helps with interpretation, the guard checks the answer, and a person makes the final decision.

## 3. Technical foundation

| Layer | Current implementation |
|---|---|
| Web and API | Next.js 15, React 19, TypeScript 5 |
| Styling | Tailwind CSS 4 and repository-owned components |
| Database and file storage | Supabase Postgres and private Supabase Storage |
| Database access | `@supabase/supabase-js` from server code only |
| Database changes | Versioned SQL in `supabase/migrations` |
| Model calls | Vercel AI SDK with Groq |
| Default model | `qwen/qwen3.6-27b`, configurable through environment variables |
| Offline provider | Deterministic `mock` provider |
| Output validation | Zod schemas owned by each agent |
| PDF extraction | `unpdf` for text-based PDFs |
| Tests and evals | Vitest plus the repository evaluation harness |
| Formatting and linting | Biome |
| Hosting path | Vercel with one daily cron |

There is no agent framework, OpenAI dependency, Redis service, production email provider, CRM connector, or autonomous side-effect tool.

## 4. Shared agent contract

Every agent follows the same boundary:

1. Load the allowed records for one subject and visitor session.
2. Apply deterministic rules before any model judgment.
3. Bound model input and output using the configured token limits.
4. Request structured output from Groq or the deterministic mock provider.
5. Validate the output with the agent's Zod schema.
6. Apply safety checks and fail closed when output is unsafe or invalid.
7. Save the result and each trace step in Supabase.
8. Set the result to human review.

The shared runtime in `packages/agents/shared-runtime` owns model configuration, input and token limits, retries, fault handling, redaction, safety guards, and trace persistence.

Model calls use temperature zero, a 30-second timeout, and up to three total attempts. The default limits are 12,000 input characters, 2,000 output tokens, and 12,000 total tokens per run. These values can be reduced through environment variables.

Every trace stores the step name, bounded input, structured output, timing, token usage, and a display copy with sensitive contact details redacted.

## 5. Agent contracts

### 5.1 Intake Brief

Folder: `packages/agents/intake-brief`

Job: turn a new inquiry into a compact, review-ready brief.

Pipeline:

1. Load the inquiry and current firm rules.
2. Match existing contacts by linked record, exact email, exact phone, or similar name.
3. Load prior interactions and matters only for an unambiguous contact.
4. Ask the model for structured qualification fields.
5. Ask the model for the brief, next action, reply draft, and call questions.
6. Apply legal-advice, fabrication, injection, confidence, and firm-rule guards.
7. Save the brief and wait for human review.

The review screen shows the fit score, fit category, known facts, missing facts, risks, recommended action, reply draft, and full trace. Conflict checks, legal assessment, representation, and client communication remain human decisions.

### 5.2 Document Intake and Routing

Folder: `packages/agents/document-routing`

Job: classify an uploaded PDF, check completeness, and prepare a routing proposal.

Pipeline:

1. Accept PDF files up to 10 MB and store them in the private `agent-documents` bucket.
2. Extract text and load up to five open matter candidates.
3. Ask the model for a structured classification with page evidence.
4. Match exact matter identifiers or unique client names before model-assisted matching.
5. Compare received document types against the trusted checklist.
6. Choose reviewer role and priority using deterministic routing rules.
7. Validate quoted evidence against extracted page text.
8. Save the result and wait for human review.

Authenticity, sufficiency, final matter routing, and client document requests remain human decisions.

### 5.3 Stalled Work and Monday Brief

Folder: `packages/agents/stalled-work`

Job: find stalled matters using firm thresholds and prepare a compact owner brief.

Pipeline:

1. Detect stale contact, overdue tasks, at-risk deadlines, unreturned document requests, ownerless matters, and stage-time outliers with deterministic logic.
2. Batch up to ten detected items for model assessment.
3. Prepare a severity, reason, recommended action, owner role, and short draft where appropriate.
4. Build a ranked owner brief.
5. Validate item references and summary counts.
6. Save the report and wait for human review.

The first issue is open by default. Tags and decision controls stay visible while supporting detail is placed inside accordions. Calls, escalation, deadline strategy, reassignment, and closure remain human decisions.

## 6. Human review boundary

Agent packages cannot write to the outbox or set a final workflow state. Review handlers in `apps/web` own those writes.

Current review actions:

- Intake: approve, edit, or reject.
- Document routing: approve, edit, or reject.
- Stalled item: approve, snooze, or dismiss.
- Stalled report: mark reviewed.

The public repository uses a simulated outbox. Adding email, CRM, case-management, or document-system delivery changes the security boundary and requires a separate implementation and review.

## 7. Data and security

Supabase migrations are the only source of truth for the database schema. Dashboard-only schema changes are not allowed.

Core records include firms, staff, contacts, interactions, leads, matters, tasks, deadlines, documents, document requests, agent runs, trace steps, agent results, reviews, the simulated outbox, and visitor sessions.

Security rules:

- Browser roles have no direct table privileges.
- `SUPABASE_SECRET_KEY`, `GROQ_API_KEY`, and `CRON_SECRET` stay server-side.
- Row-level security is enabled on core tables.
- Visitor-created records are isolated by `visitor_session_id`.
- Public runs are limited to 10 per visitor session and 200 globally each day by default.
- Visitor sessions and their stored PDFs are purged after 24 hours.
- PDFs must use the PDF MIME type and cannot exceed 10 MB.
- Untrusted inquiry, PDF, and matter text is treated as data, never as an instruction.
- Model output is schema-validated and unsafe drafts fail closed.
- Test-only fault injection cannot run in production.

## 8. Interface standard

Every front-facing view must be compact, comprehensive, and easy to scan.

- Put the decision-critical summary and controls in the first viewport.
- Use consistent status labels and accessible color coding.
- Keep tags visible outside accordions.
- Put supporting evidence and traces in expanders.
- Make the primary review action visually clear.
- Keep approve, edit, reject, dismiss, and snooze controls legible in every state.
- Show what the agent prepared and what still requires a human.

## 9. Evaluation and release evidence

Agent-specific datasets live inside each labelled agent folder. The shared evaluation harness lives in `packages/evals`.

The committed release gate covers:

| Area | Cases |
|---|---:|
| Intake contracts | 60 |
| Document contracts | 60 |
| Stalled-work snapshots | 6 |
| Pressure cases | 45 |
| Red-team cases | 40 |
| Total | 211 |

Contract checks prove deterministic expectations and safe failure behavior. They do not prove universal model accuracy. A separate live check verifies that the configured Groq model can return the required structured schemas.

Use focused checks during small changes. Run the full checkpoint after a major change or before deployment:

```bash
pnpm release:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## 10. Repository organization

```text
apps/web                         Next.js dashboard and server routes
packages/agents/intake-brief     Intake agent, UI, tests, and evals
packages/agents/document-routing Document agent, fixtures, UI, tests, and evals
packages/agents/stalled-work     Stalled-work agent, UI, tests, and evals
packages/agents/shared-runtime   Shared model, guard, limit, and trace code
packages/db                      Supabase client and typed queries
packages/seed                    Fixed anonymized reference records
packages/evals                   Shared evaluation harness
supabase/migrations              Versioned database schema
deployment/client                Self-hosting setup and verification
docs                             Security, rules, decisions, and reports
```

Each agent keeps its own pipeline, prompts, schemas, UI, fixtures, tests, eval cases, and README in its labelled folder. Shared behavior belongs in the shared runtime. Next.js routes remain thin adapters.

## 11. Self-hosting contract

The code is free to use and self-host under the MIT License. Each installation provides its own Supabase project, Groq API key, and hosting account.

The supported setup path is:

```bash
pnpm install --frozen-lockfile
cp apps/web/.env.example apps/web/.env.local
deployment/client/setup-client.sh
pnpm exec supabase login
pnpm exec supabase link --project-ref YOUR_PROJECT_REF
pnpm exec supabase db push
pnpm seed
deployment/client/verify-client.sh
pnpm dev
```

Production deployment uses the same environment values on Vercel. Each client should use separate Supabase, Groq, and hosting credentials.

## 12. Explicitly out of scope

- Autonomous legal advice, conflict clearance, deadline calculation, or representation decisions.
- Production email, SMS, CRM, case-management, or document-system delivery.
- Visitor authentication and staff role management.
- Encryption beyond the hosting providers' defaults.
- A guarantee of accuracy, availability, free-tier capacity, or zero operating cost.
- A fresh-clone installation guarantee until that workflow is separately tested.
