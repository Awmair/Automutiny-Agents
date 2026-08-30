# Stalled Work & Monday Brief Agent

## Job

Detect open matters that have gone quiet or are at risk, prepare matter-scoped follow-ups and assemble a linked Monday owner brief.

## Public interface

The module exports `submitStalledRun`, `runStalledWork`, report detail, bounded schemas, and compact queue and owner-brief UI components. Next.js routes remain thin adapters; the server-only web review executor owns approve, snooze, dismiss and report-review changes.

## Pipeline

`detect deterministically → assess in batches of 10 → draft actions → verify brief counts → save for review`

The dashboard clock can advance by up to five years for safe scenario testing. The owner brief keeps severity and issue tags visible in compact accordion rows; the first issue opens by default and each row expands to its evidence, drafted action, and review controls. Approve creates a simulated follow-up or internal task; snooze and dismiss preserve the human decision for later evaluation.

## Human boundary

A human chooses personal client calls, escalation and deadline strategy, staff reassignment and matter closure. The agent module cannot create the final simulated follow-up or task.

## Folder ownership

Stalled-work source, UI modules, snapshot fixtures, tests, evals and red-team cases belong here. Shared model, trace, retry, cost and common guard behaviour belongs in `../shared-runtime`.

## Verification

```bash
pnpm --filter @automutiny/stalled-work-agent typecheck
pnpm test packages/agents/stalled-work
```
