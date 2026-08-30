import { createHash, randomUUID } from "node:crypto";
import { configuredFirmName } from "@automutiny/agent-runtime";
import { createServerDatabaseClient } from "@automutiny/db";
import type { SupabaseClient } from "@supabase/supabase-js";

import { runIntake } from "./run";
import type { IntakeSubmission } from "./schemas";

type SubmitIntakeOptions = {
  client?: SupabaseClient;
  visitorSessionId: string;
};

type ContactIdRow = {
  id: string;
};

type ExistingLeadRow = {
  id: string;
};

export function intakeRequestKey(input: IntakeSubmission) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

async function firmId(client: SupabaseClient) {
  const firmName = configuredFirmName();
  const result = await client.from("firms").select("id").eq("name", firmName).maybeSingle();
  if (result.error) throw new Error(`Could not load the configured firm: ${result.error.message}`);
  if (!result.data) throw new Error(`${firmName} is not configured in Supabase.`);
  return result.data.id as string;
}

async function resolveContactId(
  client: SupabaseClient,
  resolvedFirmId: string,
  input: IntakeSubmission,
  visitorSessionId: string,
) {
  const matchesResult = await client
    .from("contacts")
    .select("id")
    .eq("firm_id", resolvedFirmId)
    .ilike("email", input.email)
    .limit(2);
  if (matchesResult.error)
    throw new Error(`Could not match the intake contact: ${matchesResult.error.message}`);
  const matches = (matchesResult.data ?? []) as ContactIdRow[];
  if (matches.length === 1 && matches[0]) return matches[0].id;
  if (matches.length > 1) return null;

  const contactId = randomUUID();
  const insertResult = await client.from("contacts").insert({
    id: contactId,
    firm_id: resolvedFirmId,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    company: input.company || null,
    source: input.how_found_us,
    notes: "Submitted through the Intake Brief Agent scenario runner.",
    visitor_session_id: visitorSessionId,
  });
  if (insertResult.error)
    throw new Error(`Could not create the intake contact: ${insertResult.error.message}`);
  return contactId;
}

export async function submitIntake(input: IntakeSubmission, options: SubmitIntakeOptions) {
  const client = options.client ?? createServerDatabaseClient();
  const resolvedFirmId = await firmId(client);
  const requestKey = intakeRequestKey(input);
  const existingResult = await client
    .from("leads")
    .select("id")
    .eq("firm_id", resolvedFirmId)
    .eq("visitor_session_id", options.visitorSessionId)
    .contains("raw_json", { _request_key: requestKey })
    .maybeSingle();
  if (existingResult.error)
    throw new Error(`Could not check the intake request: ${existingResult.error.message}`);
  const existing = existingResult.data as ExistingLeadRow | null;
  if (existing) {
    const result = await runIntake(existing.id, { client });
    return { leadId: existing.id, ...result };
  }
  const contactId = await resolveContactId(client, resolvedFirmId, input, options.visitorSessionId);
  const leadId = randomUUID();
  const leadResult = await client.from("leads").insert({
    id: leadId,
    firm_id: resolvedFirmId,
    contact_id: contactId,
    source: "website",
    raw_json: { ...input, _request_key: requestKey },
    practice_area_guess: null,
    status: "new",
    visitor_session_id: options.visitorSessionId,
  });
  if (leadResult.error)
    throw new Error(`Could not create the intake lead: ${leadResult.error.message}`);

  const result = await runIntake(leadId, { client });
  return { leadId, ...result };
}
