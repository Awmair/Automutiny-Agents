# ADR 001: Human review owns side effects

## Decision

Agent packages stop after saving a guarded proposal for review. Only server-only code in `apps/web/lib/review-actions.ts` may convert an authenticated review decision into a simulated outbox row or final workflow status.

## Why

This keeps model output advisory, makes the action boundary easy to audit, and prevents an agent module from accidentally sending or routing work.

## Consequence

Any future email, CRM or document connector must be added behind this executor and separately approved and tested.
