# Changelog

## Unreleased

### Added

- Firm intake qualification rules, document checklists, and matter SLA rules.
- Human decision boundaries for all three agent workflows.
- pnpm workspace tooling with strict TypeScript, Biome, Vitest and Next.js production checks.
- Separate Intake Brief, Document Routing and Stalled Work agent modules, each with its own README, public definition and focused test.
- Shared agent-runtime module and a responsive Next.js landing shell.
- Versioned Supabase core schema with constraints, trace storage, server-only access and visitor-session cleanup.
- Operational Intake Brief Agent with six scenarios, Groq/Qwen qualification and drafting, deterministic guards, six-step traces, visitor limits, owner and trace views, and session-owned review actions.
- Operational Document Intake & Routing Agent with private 10 MB PDF upload, eight agent-owned fixtures, PDF text extraction, evidence guards, matter/checklist routing, compact review UI, and approve/edit/reject actions.
- Operational Stalled Work & Monday Brief Agent with deterministic SLA detection, batched Qwen assessment, sandbox clock advance, count-verified owner brief, compact severity view, and approve/snooze/dismiss actions.
- Hardening controls for bounded model input and tokens, deterministic mock runs, safe fault injection, duplicate intake protection, health checks, daily cleanup and stalled-work scheduling.
- Contract, pressure and red-team release gates plus live Groq schema evidence, a compact failure lab, social preview metadata and architecture decisions.
- A reusable client installation package with a guided credential wizard, profile template, verification script and onboarding guide.

### Changed

- Set the firm identity to Briar & Calder LLP after the original name failed the collision check.
- Replaced the initial landing shell with the Automutiny visual system and an infrastructure-led agent showcase.
- Compacted the Monday owner brief into tagged issue accordions, opened the first issue by default, and clarified Review, Approve, Snooze and Dismiss controls.
- Moved every final workflow and simulated outbox write behind the server-only human review executor.

### Recording-ready moments

- Firm rulebook: capture `docs/firm/intake-rules.md` to show that operating rules were defined before agent code.
- Foundation shell: capture the landing page to introduce the three-agent system and shared human-review pattern.
- Data spine: capture `supabase/migrations/20260830050000_core_schema.sql` to explain how records, traces and human reviews connect.
- Agent 1 full path: run a scenario at `/intake`, open its saved review, switch to Under the hood, then show the simulated outbox confirmation after approval.
- Agent 2 full path: run a prepared PDF at `/documents`, scan the evidence and checklist in one viewport, open the technical trace, then approve or correct the proposed route.
- Agent 3 owner brief: open `/stalled`, run the SLA scan, show the severity summary and linked evidence, then approve, snooze, or dismiss one action.
