import { configuredFirmName } from "@automutiny/agent-runtime";
import { createServerDatabaseClient } from "@automutiny/db";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runStalledWork } from "./run";

export async function submitStalledRun(
  advanceDays: number,
  options: { client?: SupabaseClient; visitorSessionId: string },
) {
  const client = options.client ?? createServerDatabaseClient();
  const firm = await client.from("firms").select("id").eq("name", configuredFirmName()).single();
  if (firm.error) throw new Error(`Could not load the configured firm: ${firm.error.message}`);
  const asOf = new Date();
  asOf.setUTCDate(asOf.getUTCDate() + advanceDays);
  return runStalledWork(firm.data.id, asOf, { client, visitorSessionId: options.visitorSessionId });
}
