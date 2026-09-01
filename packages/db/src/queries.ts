import type { SupabaseClient } from "@supabase/supabase-js";

import { createServerDatabaseClient } from "./client";
import {
  type AgentQueue,
  type AgentQueueId,
  type AgentQueueSummary,
  type OperationalAgentId,
  type OperationalCaseDetail,
  type OperationalOutput,
  operationalAgentIds,
} from "./types";

type JsonRecord = Record<string, unknown>;

type IntakeLeadRow = {
  id: string;
  raw_json: JsonRecord;
  practice_area_guess: string | null;
  status: string;
  created_at: string;
};

type BriefRow = {
  id: string;
  lead_id: string;
  brief_md: string;
  next_action: string;
  confidence: number;
  status: string;
};

type DocumentRow = {
  id: string;
  filename: string;
  status: string;
  created_at: string;
};

type DocumentResultRow = {
  id: string;
  document_id: string;
  classification_json: JsonRecord;
  routing_json: JsonRecord;
  confidence: number;
  status: string;
};

type StalledItemRow = {
  id: string;
  report_id: string;
  matter_id: string;
  kind: string;
  severity: string;
  evidence_json: JsonRecord;
  drafted_action: string | null;
  decision: string | null;
  created_at: string;
};

type MatterRow = {
  id: string;
  matter_type: string;
  stage: string;
};

type OperationalCaseRow = {
  id: string;
  agent: OperationalAgentId;
  scenario_id: string;
  subject: string;
  input_json: JsonRecord;
  output_json: JsonRecord;
  confidence: number;
  priority: string;
  status: string;
  run_id: string;
  visitor_session_id: string | null;
  created_at: string;
};

function assertQuery<T>(data: T | null, error: { message: string } | null, context: string): T {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }

  return data ?? ([] as T);
}

function readable(value: string) {
  return value.replaceAll("_", " ");
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function firstLine(value: string) {
  return (
    value
      .split("\n")
      .find((line) => line.trim())
      ?.replace(/^#+\s*/, "") ?? value
  );
}

async function getIntakeQueue(client: SupabaseClient): Promise<AgentQueue> {
  const leadsResult = await client
    .from("leads")
    .select("id, raw_json, practice_area_guess, status, created_at")
    .is("visitor_session_id", null)
    .in("status", ["new", "running", "review"])
    .order("created_at", { ascending: false });
  const leads = assertQuery(
    leadsResult.data as IntakeLeadRow[] | null,
    leadsResult.error,
    "Could not load intake queue",
  );
  const leadIds = leads.map((lead) => lead.id);
  const briefsResult = leadIds.length
    ? await client
        .from("briefs")
        .select("id, lead_id, brief_md, next_action, confidence, status")
        .is("visitor_session_id", null)
        .in("lead_id", leadIds)
    : { data: [], error: null };
  const briefs = assertQuery(
    briefsResult.data as BriefRow[] | null,
    briefsResult.error,
    "Could not load intake results",
  );
  const briefByLead = new Map(briefs.map((brief) => [brief.lead_id, brief]));

  const items = leads.map((lead) => {
    const brief = briefByLead.get(lead.id);
    const matter = text(lead.raw_json.matter_description, "New inquiry awaiting review");

    return {
      id: lead.id,
      subject: text(lead.raw_json.name, "Unnamed inquiry"),
      summary: brief
        ? `${readable(brief.next_action)} · ${firstLine(brief.brief_md)}`
        : `${lead.practice_area_guess ?? "Unclassified"} · ${matter}`,
      confidence: brief?.confidence ?? null,
      createdAt: lead.created_at,
      status: brief ? "Human review" : readable(lead.status),
      href: brief ? `/intake/${brief.id}` : null,
    };
  });

  return {
    agentId: "intake-brief",
    items,
    awaitingReview: briefs.filter((brief) => brief.status === "review").length,
  };
}

async function getDocumentQueue(client: SupabaseClient): Promise<AgentQueue> {
  const documentsResult = await client
    .from("documents")
    .select("id, filename, status, created_at")
    .is("visitor_session_id", null)
    .in("status", ["new", "running", "review"])
    .order("created_at", { ascending: false });
  const documents = assertQuery(
    documentsResult.data as DocumentRow[] | null,
    documentsResult.error,
    "Could not load document queue",
  );
  const documentIds = documents.map((document) => document.id);
  const resultsQuery = documentIds.length
    ? await client
        .from("document_results")
        .select("id, document_id, classification_json, routing_json, confidence, status")
        .is("visitor_session_id", null)
        .in("document_id", documentIds)
    : { data: [], error: null };
  const results = assertQuery(
    resultsQuery.data as DocumentResultRow[] | null,
    resultsQuery.error,
    "Could not load document results",
  );
  const resultByDocument = new Map(results.map((result) => [result.document_id, result]));

  const items = documents.map((document) => {
    const result = resultByDocument.get(document.id);
    const documentType = result
      ? text(
          result.classification_json.doc_type ?? result.classification_json.document_type,
          "Document",
        )
      : "Unclassified document";
    const destination = result
      ? text(result.routing_json.reviewer_role ?? result.routing_json.destination, "Route pending")
      : "Route pending";

    return {
      id: document.id,
      subject: document.filename,
      summary: `${documentType} · ${destination}`,
      confidence: result?.confidence ?? null,
      createdAt: document.created_at,
      status: result ? "Human review" : readable(document.status),
      href: result ? `/documents/${result.id}` : null,
    };
  });

  return {
    agentId: "document-routing",
    items,
    awaitingReview: results.filter((result) => result.status === "review").length,
  };
}

async function getStalledQueue(client: SupabaseClient): Promise<AgentQueue> {
  const itemsResult = await client
    .from("stalled_items")
    .select(
      "id, report_id, matter_id, kind, severity, evidence_json, drafted_action, decision, created_at",
    )
    .is("visitor_session_id", null)
    .is("decision", null)
    .order("created_at", { ascending: false });
  const stalledItems = assertQuery(
    itemsResult.data as StalledItemRow[] | null,
    itemsResult.error,
    "Could not load stalled work queue",
  );
  const matterIds = [...new Set(stalledItems.map((item) => item.matter_id))];
  const mattersQuery = matterIds.length
    ? await client.from("matters").select("id, matter_type, stage").in("id", matterIds)
    : { data: [], error: null };
  const matters = assertQuery(
    mattersQuery.data as MatterRow[] | null,
    mattersQuery.error,
    "Could not load stalled matters",
  );
  const matterById = new Map(matters.map((matter) => [matter.id, matter]));

  return {
    agentId: "stalled-work",
    items: stalledItems.map((item) => {
      const matter = matterById.get(item.matter_id);
      const evidenceConfidence = item.evidence_json.confidence;

      return {
        id: item.id,
        subject: matter ? `${readable(matter.matter_type)} · ${matter.stage}` : "Matter",
        summary: item.drafted_action ?? readable(item.kind),
        confidence: typeof evidenceConfidence === "number" ? evidenceConfidence : null,
        createdAt: item.created_at,
        status: `${item.severity} priority`,
        href: `/stalled/${item.report_id}`,
      };
    }),
    awaitingReview: stalledItems.length,
  };
}

async function getOperationalQueue(
  client: SupabaseClient,
  agentId: OperationalAgentId,
): Promise<AgentQueue> {
  const result = await client
    .from("operational_cases")
    .select(
      "id, agent, scenario_id, subject, input_json, output_json, confidence, priority, status, run_id, visitor_session_id, created_at",
    )
    .eq("agent", agentId)
    .is("visitor_session_id", null)
    .order("created_at", { ascending: false });
  const rows = assertQuery(
    result.data as OperationalCaseRow[] | null,
    result.error,
    `Could not load ${agentId} queue`,
  );

  return {
    agentId,
    items: rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      summary: text(row.output_json.headline, "Prepared operational review"),
      confidence: Number(row.confidence),
      createdAt: row.created_at,
      status: row.status === "review" ? `${readable(row.priority)} priority` : readable(row.status),
      href: `/operations/${row.id}`,
    })),
    awaitingReview: rows.filter((row) => row.status === "review").length,
  };
}

export async function getAgentQueue(
  agentId: AgentQueueId,
  client: SupabaseClient = createServerDatabaseClient(),
): Promise<AgentQueue> {
  if (agentId === "intake-brief") return getIntakeQueue(client);
  if (agentId === "document-routing") return getDocumentQueue(client);
  if (agentId === "stalled-work") return getStalledQueue(client);
  return getOperationalQueue(client, agentId);
}

export async function getAgentQueues(
  client: SupabaseClient = createServerDatabaseClient(),
): Promise<AgentQueue[]> {
  return Promise.all([
    getIntakeQueue(client),
    getDocumentQueue(client),
    getStalledQueue(client),
    ...operationalAgentIds.map((agentId) => getOperationalQueue(client, agentId)),
  ]);
}

export async function getOperationalCaseDetail(
  caseId: string,
  client: SupabaseClient = createServerDatabaseClient(),
): Promise<OperationalCaseDetail | null> {
  const caseResult = await client
    .from("operational_cases")
    .select(
      "id, agent, scenario_id, subject, input_json, output_json, confidence, priority, status, run_id, visitor_session_id, created_at",
    )
    .eq("id", caseId)
    .maybeSingle();
  if (caseResult.error)
    throw new Error(`Could not load operational case: ${caseResult.error.message}`);
  if (!caseResult.data) return null;
  const row = caseResult.data as OperationalCaseRow;
  const [runResult, stepsResult] = await Promise.all([
    client
      .from("agent_runs")
      .select("id, model, status, input_tokens, output_tokens, cost_usd, started_at, finished_at")
      .eq("id", row.run_id)
      .single(),
    client
      .from("agent_steps")
      .select("seq, name, display_input_json, display_output_json, tokens, note")
      .eq("run_id", row.run_id)
      .order("seq", { ascending: true }),
  ]);
  if (runResult.error)
    throw new Error(`Could not load operational run: ${runResult.error.message}`);
  if (stepsResult.error)
    throw new Error(`Could not load operational trace: ${stepsResult.error.message}`);
  const run = runResult.data;

  return {
    id: row.id,
    agentId: row.agent,
    scenarioId: row.scenario_id,
    subject: row.subject,
    input: row.input_json,
    output: row.output_json as OperationalOutput,
    status: row.status,
    visitorSessionId: row.visitor_session_id,
    createdAt: row.created_at,
    run: {
      id: run.id,
      model: run.model,
      status: run.status,
      inputTokens: run.input_tokens,
      outputTokens: run.output_tokens,
      costUsd: Number(run.cost_usd),
      startedAt: run.started_at,
      finishedAt: run.finished_at,
    },
    steps: (stepsResult.data ?? []).map((step) => ({
      sequence: step.seq,
      name: step.name,
      input: step.display_input_json,
      output: step.display_output_json,
      tokens: step.tokens,
      note: step.note,
    })),
  };
}

export async function getAgentQueueSummaries(
  client: SupabaseClient = createServerDatabaseClient(),
): Promise<AgentQueueSummary[]> {
  const queues = await getAgentQueues(client);
  return queues.map((queue) => ({
    agentId: queue.agentId,
    total: queue.items.length,
    awaitingReview: queue.awaitingReview,
  }));
}
