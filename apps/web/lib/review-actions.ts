import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@automutiny/db";
import type { DocumentReviewInput } from "@automutiny/document-routing-agent";
import { assertSafeIntakeReply, type IntakeReviewInput } from "@automutiny/intake-brief-agent";
import type { StalledItemReview } from "@automutiny/stalled-work-agent";
import { configuredFirmName } from "./config";

export class ReviewAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewAccessError";
  }
}

type JsonRecord = Record<string, unknown>;

function emailFrom(value: unknown) {
  return typeof value === "string" && value.includes("@") ? value : null;
}

function requireReviewOwnership(
  visitorSessionId: string | null,
  expected: string,
  message: string,
) {
  if (visitorSessionId !== expected) throw new ReviewAccessError(message);
}

export async function reviewIntakeBrief(
  client: SupabaseClient,
  briefId: string,
  input: IntakeReviewInput,
  visitorSessionId: string,
) {
  const briefResult = await client
    .from("briefs")
    .select("id, lead_id, run_id, reply_draft, visitor_session_id")
    .eq("id", briefId)
    .maybeSingle();
  if (briefResult.error)
    throw new Error(`Could not load review target: ${briefResult.error.message}`);
  if (!briefResult.data) throw new Error("The intake brief was not found.");
  requireReviewOwnership(
    briefResult.data.visitor_session_id,
    visitorSessionId,
    "Reference records are read-only. Run a new inquiry to use the review controls.",
  );

  const leadResult = await client
    .from("leads")
    .select("id, firm_id, contact_id, raw_json")
    .eq("id", briefResult.data.lead_id)
    .single();
  if (leadResult.error) throw new Error(`Could not load review lead: ${leadResult.error.message}`);
  const lead = leadResult.data as {
    id: string;
    firm_id: string;
    contact_id: string | null;
    raw_json: JsonRecord;
  };
  let recipient = emailFrom(lead.raw_json.email);
  if (!recipient && lead.contact_id) {
    const contactResult = await client
      .from("contacts")
      .select("email")
      .eq("id", lead.contact_id)
      .maybeSingle();
    if (contactResult.error)
      throw new Error(`Could not load review recipient: ${contactResult.error.message}`);
    recipient = emailFrom(contactResult.data?.email);
  }

  const reply =
    input.decision === "edit" ? (input.edited_reply ?? "") : briefResult.data.reply_draft;
  if (input.decision !== "reject") {
    assertSafeIntakeReply(reply);
    if (!recipient) throw new Error("The inquiry has no email address for the simulated outbox.");
  }

  const reviewId = randomUUID();
  const reviewResult = await client.from("reviews").insert({
    id: reviewId,
    subject_type: "brief",
    subject_id: briefResult.data.id,
    run_id: briefResult.data.run_id,
    decision: input.decision,
    edited_payload_json:
      input.decision === "edit"
        ? { reply_draft: reply }
        : input.decision === "reject"
          ? { reason: input.reason }
          : null,
    reviewer: "visitor",
    visitor_session_id: visitorSessionId,
  });
  if (reviewResult.error) throw new Error(`Could not save review: ${reviewResult.error.message}`);

  if (input.decision !== "reject" && recipient) {
    const outboxResult = await client.from("outbox").insert({
      id: randomUUID(),
      firm_id: lead.firm_id,
      to_email: recipient,
      subject: `Your inquiry to ${configuredFirmName()}`,
      body: reply,
      related_type: "brief",
      related_id: briefResult.data.id,
      status: "queued",
      visitor_session_id: visitorSessionId,
    });
    if (outboxResult.error)
      throw new Error(`Could not create simulated outbox item: ${outboxResult.error.message}`);
  }

  const briefStatus =
    input.decision === "approve" ? "approved" : input.decision === "edit" ? "edited" : "rejected";
  const leadStatus = input.decision === "reject" ? "rejected" : "sent";
  const [briefUpdate, leadUpdate, runUpdate] = await Promise.all([
    client.from("briefs").update({ status: briefStatus }).eq("id", briefResult.data.id),
    client.from("leads").update({ status: leadStatus }).eq("id", briefResult.data.lead_id),
    client.from("agent_runs").update({ status: "finished" }).eq("id", briefResult.data.run_id),
  ]);
  const updateError = briefUpdate.error ?? leadUpdate.error ?? runUpdate.error;
  if (updateError) throw new Error(`Could not finish review: ${updateError.message}`);
  return {
    reviewId,
    decision: input.decision,
    briefStatus,
    leadStatus,
    outboxQueued: input.decision !== "reject",
  };
}

export async function reviewDocumentResult(
  client: SupabaseClient,
  resultId: string,
  input: DocumentReviewInput,
  visitorSessionId: string,
) {
  const target = await client
    .from("document_results")
    .select("id, document_id, run_id, routing_json, request_draft, visitor_session_id")
    .eq("id", resultId)
    .single();
  if (target.error) throw new Error(`Could not load review target: ${target.error.message}`);
  requireReviewOwnership(
    target.data.visitor_session_id,
    visitorSessionId,
    "Reference records are read-only. Process a new document to use these controls.",
  );
  const routing = { ...(target.data.routing_json as Record<string, unknown>) };
  if (input.decision === "edit") {
    if (input.matter_id !== undefined) routing.matter_id = input.matter_id;
    if (input.reviewer_role) routing.reviewer_role = input.reviewer_role;
    if (input.priority) routing.priority = input.priority;
  }
  const review = await client.from("reviews").insert({
    id: randomUUID(),
    subject_type: "document_result",
    subject_id: resultId,
    run_id: target.data.run_id,
    decision: input.decision,
    edited_payload_json:
      input.decision === "edit"
        ? { routing }
        : input.decision === "reject"
          ? { reason: input.reason }
          : null,
    reviewer: "visitor",
    visitor_session_id: visitorSessionId,
  });
  if (review.error) throw new Error(`Could not save review: ${review.error.message}`);
  const status =
    input.decision === "approve" ? "approved" : input.decision === "edit" ? "edited" : "rejected";
  if (input.decision !== "reject" && routing.matter_id) {
    const documentUpdate = await client
      .from("documents")
      .update({ status: "routed", matter_id: routing.matter_id })
      .eq("id", target.data.document_id);
    if (documentUpdate.error)
      throw new Error(`Could not route document: ${documentUpdate.error.message}`);
    const classification = await client
      .from("document_results")
      .select("classification_json")
      .eq("id", resultId)
      .single();
    if (classification.error)
      throw new Error(`Could not load classification: ${classification.error.message}`);
    const docType = (classification.data.classification_json as { doc_type?: string } | undefined)
      ?.doc_type;
    if (docType) {
      const requestUpdate = await client
        .from("document_requests")
        .update({ received_at: new Date().toISOString() })
        .eq("matter_id", routing.matter_id)
        .ilike("doc_type", docType.replaceAll("_", " "))
        .is("received_at", null);
      if (requestUpdate.error)
        throw new Error(`Could not update document request: ${requestUpdate.error.message}`);
    }
    if (target.data.request_draft) {
      const matter = await client
        .from("matters")
        .select("firm_id, contact:contacts(email)")
        .eq("id", routing.matter_id)
        .single();
      if (matter.error) throw new Error(`Could not load routed matter: ${matter.error.message}`);
      const contact = matter.data.contact as unknown as { email?: string } | null;
      if (contact?.email) {
        const outbox = await client.from("outbox").insert({
          id: randomUUID(),
          firm_id: matter.data.firm_id,
          to_email: contact.email,
          subject: "Documents needed for your file",
          body: target.data.request_draft,
          related_type: "document_result",
          related_id: resultId,
          status: "queued",
          visitor_session_id: visitorSessionId,
        });
        if (outbox.error)
          throw new Error(`Could not queue document request: ${outbox.error.message}`);
      }
    }
  } else {
    const documentUpdate = await client
      .from("documents")
      .update({ status: "rejected" })
      .eq("id", target.data.document_id);
    if (documentUpdate.error)
      throw new Error(`Could not reject document: ${documentUpdate.error.message}`);
  }
  const resultUpdate = await client
    .from("document_results")
    .update({ status, routing_json: routing })
    .eq("id", resultId);
  if (resultUpdate.error)
    throw new Error(`Could not finish document review: ${resultUpdate.error.message}`);
  const runUpdate = await client
    .from("agent_runs")
    .update({ status: "finished" })
    .eq("id", target.data.run_id);
  if (runUpdate.error) throw new Error(`Could not finish agent run: ${runUpdate.error.message}`);
  return {
    decision: input.decision,
    status,
    routed: input.decision !== "reject" && Boolean(routing.matter_id),
  };
}

export async function reviewStalledItem(
  client: SupabaseClient,
  itemId: string,
  input: StalledItemReview,
  visitorSessionId: string,
) {
  const target = await client
    .from("stalled_items")
    .select("*, report:stalled_reports(run_id,firm_id), matter:matters(contact:contacts(email))")
    .eq("id", itemId)
    .single();
  if (target.error) throw new Error(`Could not load stalled item: ${target.error.message}`);
  requireReviewOwnership(
    target.data.visitor_session_id,
    visitorSessionId,
    "Reference records are read-only. Run a new scan to use these controls.",
  );
  const report = target.data.report as unknown as { run_id: string; firm_id: string };
  const evidence = target.data.evidence_json as {
    recommended_action?: string;
    owner_role?: string;
  };
  const review = await client.from("reviews").insert({
    id: randomUUID(),
    subject_type: "stalled_item",
    subject_id: itemId,
    run_id: report.run_id,
    decision: input.decision,
    edited_payload_json: input.reason ? { reason: input.reason } : null,
    reviewer: "visitor",
    visitor_session_id: visitorSessionId,
  });
  if (review.error) throw new Error(`Could not save stalled review: ${review.error.message}`);
  const decision =
    input.decision === "approve"
      ? "approved"
      : input.decision === "snooze_7d"
        ? "snoozed"
        : "dismissed";
  const update = await client
    .from("stalled_items")
    .update({ decision, decided_by: "visitor", decided_at: new Date().toISOString() })
    .eq("id", itemId);
  if (update.error) throw new Error(`Could not finish item review: ${update.error.message}`);
  if (input.decision === "approve") {
    const matter = target.data.matter as unknown as { contact?: { email?: string } };
    if (evidence.recommended_action === "client_followup" && matter.contact?.email) {
      const outbox = await client.from("outbox").insert({
        id: randomUUID(),
        firm_id: report.firm_id,
        to_email: matter.contact.email,
        subject: "Status needed for your matter",
        body: target.data.drafted_action,
        related_type: "stalled_item",
        related_id: itemId,
        status: "queued",
        visitor_session_id: visitorSessionId,
      });
      if (outbox.error)
        throw new Error(`Could not queue stalled-work follow-up: ${outbox.error.message}`);
    } else {
      const task = await client.from("matter_tasks").insert({
        id: randomUUID(),
        matter_id: target.data.matter_id,
        title: target.data.drafted_action,
        due_at: null,
        visitor_session_id: visitorSessionId,
      });
      if (task.error) throw new Error(`Could not create follow-up task: ${task.error.message}`);
    }
  }
  return { itemId, decision };
}

export async function markStalledReportReviewed(
  client: SupabaseClient,
  reportId: string,
  visitorSessionId: string,
) {
  const report = await client
    .from("stalled_reports")
    .select("run_id,visitor_session_id")
    .eq("id", reportId)
    .single();
  if (report.error) throw new Error(`Could not load report: ${report.error.message}`);
  requireReviewOwnership(
    report.data.visitor_session_id,
    visitorSessionId,
    "Reference records are read-only.",
  );
  const review = await client.from("reviews").insert({
    id: randomUUID(),
    subject_type: "stalled_report",
    subject_id: reportId,
    run_id: report.data.run_id,
    decision: "mark_reviewed",
    reviewer: "visitor",
    visitor_session_id: visitorSessionId,
  });
  if (review.error) throw new Error(`Could not save report review: ${review.error.message}`);
  const reportUpdate = await client
    .from("stalled_reports")
    .update({ status: "reviewed" })
    .eq("id", reportId);
  if (reportUpdate.error)
    throw new Error(`Could not mark report reviewed: ${reportUpdate.error.message}`);
  const runUpdate = await client
    .from("agent_runs")
    .update({ status: "finished" })
    .eq("id", report.data.run_id);
  if (runUpdate.error) throw new Error(`Could not finish report run: ${runUpdate.error.message}`);
  return { status: "reviewed" };
}
