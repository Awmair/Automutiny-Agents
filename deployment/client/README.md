# Self-hosting Automutiny Agents

The source code is free to use and self-host under the MIT License. Each installation needs its own Supabase project, Groq API key, and hosting account. The provider accounts may have free tiers, but they are separate from this repository.

This guide uses the existing Supabase, Groq, and Vercel workflow. It does not connect the agents to email, a CRM, or another external system. Approved work remains in the simulated outbox.

## 1. Requirements

- Node.js 22 or newer
- pnpm 10.34
- A Supabase account and project
- A Groq account and API key for live model runs
- A Vercel account for the documented hosting path

Install the repository dependencies:

```bash
pnpm install --frozen-lockfile
```

## 2. Configure the installation

Create the local environment file:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Run the setup wizard:

```bash
deployment/client/setup-client.sh
```

The wizard writes these values only to the ignored `apps/web/.env.local` file:

| Variable | Purpose |
|---|---|
| `FIRM_NAME` | Business name shown by the app |
| `NEXT_PUBLIC_SITE_URL` | Local or deployed site URL |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Server-only database credential |
| `MODEL_PROVIDER` | `groq` for live runs or `mock` for deterministic runs |
| `MODEL_ID` | Groq model identifier |
| `GROQ_API_KEY` | Server-only Groq credential |
| `CRON_SECRET` | Protects the scheduled stalled-work route |
| Runtime limit variables | Bound model input, output, total tokens, and public run volume |

Never expose `SUPABASE_SECRET_KEY`, `GROQ_API_KEY`, or `CRON_SECRET` in browser code or commit them to Git.

## 3. Apply the database schema

Authenticate the Supabase CLI, link the project, and apply the versioned migrations:

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref YOUR_PROJECT_REF
pnpm exec supabase db push
```

Do not make dashboard-only schema changes. `supabase/migrations` is the source of truth.

Load the fixed anonymized reference records:

```bash
pnpm seed
```

The seed command replaces only the configured firm's fixed reference records. Visitor sessions are preserved.

## 4. Verify locally

Run the structural and contract verifier:

```bash
deployment/client/verify-client.sh
```

Start the app:

```bash
pnpm dev
```

Check these paths:

- `http://localhost:3000/api/health` returns `status: ok`
- `/intake` completes one run and opens human review
- `/documents` accepts an included reference PDF and opens human review
- `/stalled` creates an owner brief and opens human review
- Each result shows its run trace

Do not approve a real external action during setup. This repository has no production delivery connector.

## 5. Deploy with Vercel

1. Import the repository into Vercel.
2. Select `apps/web` as the application directory.
3. Copy every value from `apps/web/.env.local` into the Vercel environment settings.
4. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS address.
5. Deploy, then verify `/api/health` and one workflow for each agent.
6. Confirm the daily cron can call `/api/cron/stalled` with `CRON_SECRET`.

The included `apps/web/vercel.json` defines the daily stalled-work schedule.

## 6. Change the business rules

Copy `deployment/client/client-profile.example.json`, then replace the example rules in `docs/firm` with the business's approved rules. Keep one current version of each rule. Do not preserve obsolete examples beside the active rules.

Before a real client handoff, confirm approvers, retention requirements, source-system mappings, and incident contacts. Any email, CRM, document-system, or case-management connector needs a separate security and side-effect review.

## 7. Production checkpoint

Run the full checkpoint before a real deployment:

```bash
pnpm release:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Then verify the deployed health endpoint, all three review flows, visitor-data cleanup, and the GitHub health-check workflow.
