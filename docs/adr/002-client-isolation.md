# ADR 002: One client installation per data project

## Decision

Each client receives its own Supabase project, Groq key, environment configuration and deployment. Agent source stays shared; business rules in `docs/firm/` are replaced in place for that client.

## Why

Separate infrastructure is the clearest isolation boundary for credentials, records, storage, retention and billing on the free-tier template.

## Consequence

Cross-client dashboards and shared databases are intentionally unsupported. A multi-tenant product would require a new authorization and isolation design.
