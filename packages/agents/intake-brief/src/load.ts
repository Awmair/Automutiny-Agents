import type { SupabaseClient } from "@supabase/supabase-js";

import { readIntakeRules } from "./rules";
import type { IntakeLead } from "./types";

export type LoadedIntake = {
  lead: IntakeLead;
  rules: string;
};

export async function loadIntake(client: SupabaseClient, leadId: string): Promise<LoadedIntake> {
  const [leadResult, rules] = await Promise.all([
    client
      .from("leads")
      .select(
        "id, firm_id, contact_id, source, raw_json, practice_area_guess, status, visitor_session_id, created_at",
      )
      .eq("id", leadId)
      .maybeSingle(),
    readIntakeRules(),
  ]);

  if (leadResult.error) throw new Error(`Could not load lead: ${leadResult.error.message}`);
  if (!leadResult.data) throw new Error(`Lead ${leadId} was not found.`);

  return {
    lead: leadResult.data as IntakeLead,
    rules,
  };
}
