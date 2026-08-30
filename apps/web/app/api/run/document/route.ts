import { createServerDatabaseClient } from "@automutiny/db";
import { readDocumentScenario, submitDocument } from "@automutiny/document-routing-agent";
import { type NextRequest, NextResponse } from "next/server";
import {
  attachVisitorCookie,
  consumeVisitorRun,
  VisitorRateLimitError,
} from "../../../../lib/visitor-session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const client = createServerDatabaseClient();
  let session: Awaited<ReturnType<typeof consumeVisitorRun>> | null = null;
  try {
    const form = await request.formData();
    session = await consumeVisitorRun(request, client);
    const uploaded = form.get("file");
    const file =
      uploaded instanceof File && uploaded.size > 0
        ? {
            bytes: new Uint8Array(await uploaded.arrayBuffer()),
            filename: uploaded.name,
            mime: uploaded.type,
          }
        : await readDocumentScenario(String(form.get("scenario") ?? ""));
    const result = await submitDocument(file, { client, visitorSessionId: session.id });
    const response = NextResponse.json(result);
    if (session.setCookie) attachVisitorCookie(response, session.id);
    return response;
  } catch (error) {
    const response = NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The Document Agent could not complete this run.",
      },
      { status: error instanceof VisitorRateLimitError ? 429 : 500 },
    );
    if (session?.setCookie) attachVisitorCookie(response, session.id);
    return response;
  }
}
