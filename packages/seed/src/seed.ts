import { createServerDatabaseClient } from "@automutiny/db";
import type { SupabaseClient } from "@supabase/supabase-js";

import { seedData, seedIds } from "./data";

async function requireSuccess(
  operation: PromiseLike<{ error: { message: string } | null }>,
  label: string,
) {
  const { error } = await operation;
  if (error) throw new Error(`${label}: ${error.message}`);
}

export async function seedDatabase(client: SupabaseClient = createServerDatabaseClient()) {
  await requireSuccess(
    client
      .from("agent_runs")
      .delete()
      .in("id", [...seedIds.runs]),
    "Could not remove previous seeded runs",
  );
  await requireSuccess(
    client.from("firms").delete().eq("id", seedIds.firm),
    "Could not remove previous seeded firm",
  );

  const inserts = [
    ["firms", seedData.firms],
    ["staff", seedData.staff],
    ["contacts", seedData.contacts],
    ["interactions", seedData.interactions],
    ["leads", seedData.leads],
    ["matters", seedData.matters],
    ["matter_tasks", seedData.matter_tasks],
    ["matter_deadlines", seedData.matter_deadlines],
    ["documents", seedData.documents],
    ["document_requests", seedData.document_requests],
    ["agent_runs", seedData.agent_runs],
    ["operational_cases", seedData.operational_cases],
    ["briefs", seedData.briefs],
    ["document_results", seedData.document_results],
    ["stalled_reports", seedData.stalled_reports],
    ["stalled_items", seedData.stalled_items],
  ] as const;

  for (const [table, rows] of inserts) {
    await requireSuccess(
      client.from(table).insert(rows as unknown as Record<string, unknown>[]),
      `Could not seed ${table}`,
    );
  }

  return Object.fromEntries(inserts.map(([table, rows]) => [table, rows.length]));
}
