import { activeFault } from "@automutiny/agent-runtime";
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ContactMatch,
  ContextBundle,
  IntakeContact,
  IntakeInteraction,
  IntakeLead,
  IntakeMatter,
} from "./types";

function normalizedEmail(value: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizedPhone(value: string | null) {
  return value?.replace(/\D/gu, "") ?? "";
}

function normalizedName(value: string | null) {
  return (
    value
      ?.normalize("NFKD")
      .replace(/[\u0300-\u036f]/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/gu, " ")
      .replace(/\s+/gu, " ")
      .trim() ?? ""
  );
}

function leadText(lead: IntakeLead, field: string) {
  const value = lead.raw_json[field];
  return typeof value === "string" && value.trim() ? value : null;
}

function nameScore(left: string, right: string) {
  const leftTokens = new Set(normalizedName(left).split(" ").filter(Boolean));
  const rightTokens = new Set(normalizedName(right).split(" ").filter(Boolean));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

export function matchContact(lead: IntakeLead, contacts: IntakeContact[]): ContactMatch {
  const linked = contacts.find((contact) => contact.id === lead.contact_id);
  if (linked) return { contact: linked, basis: "linked_contact", candidateIds: [linked.id] };

  const email = normalizedEmail(leadText(lead, "email"));
  const emailMatches = email
    ? contacts.filter((contact) => normalizedEmail(contact.email) === email)
    : [];
  if (emailMatches.length === 1 && emailMatches[0]) {
    return { contact: emailMatches[0], basis: "exact_email", candidateIds: [emailMatches[0].id] };
  }
  if (emailMatches.length > 1) {
    return { contact: null, basis: "ambiguous", candidateIds: emailMatches.map(({ id }) => id) };
  }

  const phone = normalizedPhone(leadText(lead, "phone"));
  const phoneMatches = phone
    ? contacts.filter((contact) => normalizedPhone(contact.phone) === phone)
    : [];
  if (phoneMatches.length === 1 && phoneMatches[0]) {
    return { contact: phoneMatches[0], basis: "exact_phone", candidateIds: [phoneMatches[0].id] };
  }
  if (phoneMatches.length > 1) {
    return { contact: null, basis: "ambiguous", candidateIds: phoneMatches.map(({ id }) => id) };
  }

  const name = leadText(lead, "name") ?? "";
  const nameMatches = contacts.filter((contact) => nameScore(name, contact.name) >= 0.8);
  if (nameMatches.length === 1 && nameMatches[0]) {
    return { contact: nameMatches[0], basis: "similar_name", candidateIds: [nameMatches[0].id] };
  }
  if (nameMatches.length > 1) {
    return { contact: null, basis: "ambiguous", candidateIds: nameMatches.map(({ id }) => id) };
  }

  return { contact: null, basis: "none", candidateIds: [] };
}

function requireRows<T>(data: T[] | null, error: { message: string } | null, context: string): T[] {
  if (error) throw new Error(`${context}: ${error.message}`);
  return data ?? [];
}

export async function gatherContext(
  client: SupabaseClient,
  lead: IntakeLead,
): Promise<ContextBundle> {
  const contactsResult = await client
    .from("contacts")
    .select("id, firm_id, name, email, phone, company, source, notes, visitor_session_id")
    .eq("firm_id", lead.firm_id)
    .limit(200);
  const allContacts = requireRows(
    contactsResult.data as IntakeContact[] | null,
    contactsResult.error,
    "Could not load contact context",
  );
  const contacts = allContacts.filter(
    (contact) =>
      contact.visitor_session_id === null || contact.visitor_session_id === lead.visitor_session_id,
  );
  const match = matchContact(lead, contacts);

  if (!match.contact) {
    return {
      lead,
      contact: null,
      contactMatch: { basis: match.basis, candidateIds: match.candidateIds },
      interactions: [],
      matters: [],
      companyLookup: null,
    };
  }

  const [interactionsResult, mattersResult] = await Promise.all([
    client
      .from("interactions")
      .select("channel, direction, occurred_at, summary")
      .eq("contact_id", match.contact.id)
      .order("occurred_at", { ascending: false })
      .limit(10),
    client
      .from("matters")
      .select("id, matter_type, stage, opened_at, status, last_client_contact_at")
      .eq("contact_id", match.contact.id)
      .order("opened_at", { ascending: false }),
  ]);
  const interactions = requireRows(
    interactionsResult.data as IntakeInteraction[] | null,
    interactionsResult.error,
    "Could not load prior interactions",
  );
  const matters = requireRows(
    mattersResult.data as IntakeMatter[] | null,
    mattersResult.error,
    "Could not load prior matters",
  );

  return {
    lead,
    contact: match.contact,
    contactMatch: { basis: match.basis, candidateIds: match.candidateIds },
    interactions,
    matters,
    companyLookup: match.contact.company
      ? {
          company: match.contact.company,
          status: activeFault() === "lookup_down" ? "lookup_unavailable" : "not_configured",
        }
      : null,
  };
}
