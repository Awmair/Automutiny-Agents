import { randomUUID } from "node:crypto";
import { configuredFirmName } from "@automutiny/agent-runtime";
import { createServerDatabaseClient } from "@automutiny/db";
import type { SupabaseClient } from "@supabase/supabase-js";

import { runDocumentRouting } from "./run";

type SubmitOptions = { client?: SupabaseClient; visitorSessionId: string };

export async function submitDocument(
  file: { bytes: Uint8Array; filename: string; mime: string },
  options: SubmitOptions,
) {
  if (file.mime !== "application/pdf" || !file.filename.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF documents are accepted.");
  }
  if (file.bytes.byteLength > 10 * 1024 * 1024) throw new Error("PDFs must be 10 MB or smaller.");
  const client = options.client ?? createServerDatabaseClient();
  const firm = await client.from("firms").select("id").eq("name", configuredFirmName()).single();
  if (firm.error) throw new Error(`Could not load the configured firm: ${firm.error.message}`);

  const documentId = randomUUID();
  const cleanName = file.filename.replace(/[^a-z0-9._-]/giu, "-");
  const storagePath = `${options.visitorSessionId}/${documentId}/${cleanName}`;
  const bucket = "agent-documents";
  const buckets = await client.storage.listBuckets();
  if (buckets.error)
    throw new Error(`Could not inspect document storage: ${buckets.error.message}`);
  if (!buckets.data.some((item) => item.name === bucket)) {
    const created = await client.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 10 * 1024 * 1024,
      allowedMimeTypes: ["application/pdf"],
    });
    if (created.error)
      throw new Error(`Could not create document storage: ${created.error.message}`);
  }
  const upload = await client.storage
    .from(bucket)
    .upload(storagePath, file.bytes, { contentType: file.mime, upsert: false });
  if (upload.error) throw new Error(`Could not store the PDF: ${upload.error.message}`);

  const inserted = await client.from("documents").insert({
    id: documentId,
    firm_id: firm.data.id,
    matter_id: null,
    storage_path: storagePath,
    filename: file.filename,
    mime: file.mime,
    status: "new",
    visitor_session_id: options.visitorSessionId,
  });
  if (inserted.error)
    throw new Error(`Could not create the document record: ${inserted.error.message}`);
  const result = await runDocumentRouting(documentId, { client });
  return { documentId, ...result };
}
