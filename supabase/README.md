# Database

`migrations/` is the only source of truth for the Supabase/Postgres schema. Do not make dashboard-only schema changes.

## Apply and verify

Use the official Supabase CLI workflow for a linked project:

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref YOUR_PROJECT_REF
pnpm exec supabase db push
pnpm seed
```

Use `pnpm exec supabase db reset` only for a local Supabase development database. It rebuilds that local database from the migrations.

The app accesses these tables only from server code using `SUPABASE_SECRET_KEY`. Existing projects may keep `SUPABASE_SERVICE_ROLE_KEY` during Supabase's key transition. Browser roles have no direct table privileges.

Visitor-owned rows reference `visitor_sessions` with cascading deletion. `purge_visitor_sessions()` removes sessions inactive for more than 24 hours and their scoped data.

The hardening migration adds a session-scoped intake request key so a repeated form submission reuses the existing lead.
