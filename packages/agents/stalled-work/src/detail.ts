import { createServerDatabaseClient } from "@automutiny/db";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getStalledReportDetail(
  reportId: string,
  client: SupabaseClient = createServerDatabaseClient(),
) {
  const report = await client.from("stalled_reports").select("*").eq("id", reportId).maybeSingle();
  if (report.error) throw new Error(`Could not load report: ${report.error.message}`);
  if (!report.data) return null;
  const [items, run, steps] = await Promise.all([
    client
      .from("stalled_items")
      .select(
        "*, matter:matters(id,matter_type,stage,last_client_contact_at,contact:contacts(name,email),staff:staff(name,role))",
      )
      .eq("report_id", reportId)
      .order("severity")
      .order("created_at"),
    client
      .from("agent_runs")
      .select("model,status,input_tokens,output_tokens,cost_usd,started_at,finished_at")
      .eq("id", report.data.run_id)
      .single(),
    client
      .from("agent_steps")
      .select("seq,name,note,tokens")
      .eq("run_id", report.data.run_id)
      .order("seq"),
  ]);
  if (items.error || run.error || steps.error)
    throw new Error(
      `Could not load report detail: ${(items.error ?? run.error ?? steps.error)?.message}`,
    );
  return { report: report.data, items: items.data ?? [], run: run.data, steps: steps.data ?? [] };
}
