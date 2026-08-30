# Intake Brief Agent

## Job

Prepare a one-screen intake brief, qualification, recommended next action and first-reply draft from an inquiry and the firm's existing context.

## Public interface

The module exports its validated `intakeBriefAgent` definition, Zod input/output schemas, six scenarios, `submitIntake()`, `runIntake(leadId)` and `getIntakeReviewDetail()`. The Next.js adapters are `POST /api/run/intake` and `POST /api/review/intake/{briefId}`.

The scenario runner lives at `/intake`. A completed run opens `/intake/{briefId}` with an owner view, a six-step redacted trace and session-owned Approve, Edit and Reject controls.

## Pipeline

`load → gatherContext → qualify → draft → guard → save for review`

- `load` reads the lead and the trusted firm rules.
- `gatherContext` matches a linked or prior contact, then loads up to 10 interactions and their matters without merging ambiguous identities.
- `qualify` and `draft` call Groq's Qwen model in JSON-object mode, then validate the result with Zod.
- `guard` blocks unsafe text and deterministically corrects actions that cross firm rules.
- `save for review` writes the brief and trace to Supabase and stops for a human.

## Human boundary

A human clears conflicts, decides whether to take the matter, gives legal advice and approves, edits or rejects every reply.

The agent module never writes final workflow state or the outbox. The server-only review executor handles Approve, Edit and Reject; Approve and Edit create a simulated outbox row. The current system does not send email.

## Folder ownership

Intake-specific source, UI modules, fixtures, tests, evals and red-team cases belong here. Shared model, trace, retry, cost and common guard behaviour belongs in `../shared-runtime`.

## Verification

```bash
packages/agents/intake-brief/node_modules/.bin/tsc --noEmit -p packages/agents/intake-brief/tsconfig.json
node_modules/.bin/vitest run packages/agents/intake-brief/tests
npm run build --prefix apps/web
```
