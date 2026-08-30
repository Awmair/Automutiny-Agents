# Document Intake & Routing Agent

## Job

Classify an incoming PDF, extract supported fields, match it to a matter, check the matter checklist and prepare routing and missing-document recommendations.

## Public interface

The module exports `submitDocument`, `runDocumentRouting`, `getDocumentReviewDetail`, eight PDF scenarios, schemas, and compact UI components. Next.js routes remain thin adapters; the server-only web review executor owns approved routing and outbox changes.

## Pipeline

`PDF upload → text extraction → classify → match → completeness → guard and route proposal → save for review`

PDFs are private in the `agent-documents` Supabase bucket, limited to PDF only and 10 MB. Model evidence is accepted only when its short quote exists on the cited page.

## Human boundary

A human confirms authenticity, legal sufficiency, matter matching and routing, then approves, edits or rejects every request. The agent module cannot perform the final routing action.

## Folder ownership

Document-specific source, UI modules, PDF fixtures, tests, evals and red-team cases belong here. Shared model, trace, retry, cost and common guard behaviour belongs in `../shared-runtime`.

## Verification

```bash
pnpm --filter @automutiny/document-routing-agent typecheck
pnpm test packages/agents/document-routing
```
