import { createServerDatabaseClient } from "@automutiny/db";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getDocumentReviewDetail(
  resultId: string,
  client: SupabaseClient = createServerDatabaseClient(),
) {
  const result = await client.from("document_results").select("*").eq("id", resultId).maybeSingle();
  if (result.error) throw new Error(`Could not load document result: ${result.error.message}`);
  if (!result.data) return null;
  const [document, run, steps] = await Promise.all([
    client
      .from("documents")
      .select("id, filename, uploaded_at, status, visitor_session_id")
      .eq("id", result.data.document_id)
      .single(),
    client
      .from("agent_runs")
      .select("model, status, input_tokens, output_tokens, cost_usd, started_at, finished_at")
      .eq("id", result.data.run_id)
      .single(),
    client
      .from("agent_steps")
      .select("seq, name, display_input_json, display_output_json, tokens, note")
      .eq("run_id", result.data.run_id)
      .order("seq"),
  ]);
  if (document.error || run.error || steps.error)
    throw new Error(
      `Could not load document trace: ${(document.error ?? run.error ?? steps.error)?.message}`,
    );
  const routing = result.data.routing_json as { matter_id?: string | null };
  const matter = routing.matter_id
    ? await client
        .from("matters")
        .select("id, matter_type, stage, contact:contacts(name,email)")
        .eq("id", routing.matter_id)
        .maybeSingle()
    : { data: null, error: null };
  if (matter.error) throw new Error(`Could not load matched matter: ${matter.error.message}`);
  return {
    result: result.data,
    document: document.data,
    run: run.data,
    steps: steps.data ?? [],
    matter: matter.data,
  };
}
