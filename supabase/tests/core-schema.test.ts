import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../migrations/20260830050000_core_schema.sql", import.meta.url),
  "utf8",
);

const tables = [
  "visitor_sessions",
  "firms",
  "staff",
  "contacts",
  "interactions",
  "leads",
  "matters",
  "matter_tasks",
  "matter_deadlines",
  "documents",
  "document_requests",
  "agent_runs",
  "agent_steps",
  "briefs",
  "document_results",
  "stalled_reports",
  "stalled_items",
  "reviews",
  "outbox",
] as const;

describe("core database migration", () => {
  it("defines every core table with timestamps and row-level security", () => {
    for (const table of tables) {
      const tableBlock = migration.match(
        new RegExp(`create table public\\.${table} \\(([\\s\\S]*?)\\n\\);`),
      )?.[1];

      expect(tableBlock, `${table} should exist`).toBeDefined();
      expect(tableBlock).toContain("created_at timestamptz");
      expect(tableBlock).toContain("updated_at timestamptz");
      expect(migration).toContain(`alter table public.${table} enable row level security;`);
    }
  });

  it("denies browser roles and keeps database access server-side", () => {
    expect(migration).toContain(
      "revoke all privileges on all tables in schema public from anon, authenticated;",
    );
    expect(migration).toContain(
      "grant all privileges on all tables in schema public to service_role;",
    );
  });

  it("cascades visitor cleanup and enforces the 24-hour purge window", () => {
    const sessionForeignKeys = migration.match(
      /visitor_session_id uuid references public\.visitor_sessions\(id\) on delete cascade/g,
    );

    expect(sessionForeignKeys?.length).toBeGreaterThanOrEqual(14);
    expect(migration).toContain("create or replace function public.purge_visitor_sessions()");
    expect(migration).toContain("last_seen_at < now() - interval '24 hours'");
  });

  it("keeps one ordered trace and prevents duplicate active runs", () => {
    expect(migration).toContain("unique (run_id, seq)");
    expect(migration).toContain("create unique index agent_runs_active_subject_idx");
    expect(migration).toContain("where status in ('running', 'review')");
  });
});
