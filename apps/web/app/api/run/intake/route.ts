import { createServerDatabaseClient } from "@automutiny/db";
import { IntakeSubmissionSchema, submitIntake } from "@automutiny/intake-brief-agent";
import { type NextRequest, NextResponse } from "next/server";

import {
  attachVisitorCookie,
  consumeVisitorRun,
  VisitorRateLimitError,
} from "../../../../lib/visitor-session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }

  const parsed = IntakeSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "The intake form is invalid." },
      { status: 400 },
    );
  }

  const client = createServerDatabaseClient();
  let session: Awaited<ReturnType<typeof consumeVisitorRun>> | null = null;
  try {
    session = await consumeVisitorRun(request, client);
    const result = await submitIntake(parsed.data, {
      client,
      visitorSessionId: session.id,
    });
    const response = NextResponse.json({
      leadId: result.leadId,
      runId: result.runId,
      briefId: result.briefId,
      status: result.status,
    });
    if (session.setCookie) attachVisitorCookie(response, session.id);
    return response;
  } catch (error) {
    const status = error instanceof VisitorRateLimitError ? 429 : 500;
    const message =
      error instanceof VisitorRateLimitError
        ? error.message
        : process.env.NODE_ENV === "production"
          ? "The Intake Agent could not complete this run."
          : error instanceof Error
            ? error.message
            : "The Intake Agent could not complete this run.";
    const response = NextResponse.json({ error: message }, { status });
    if (session?.setCookie) attachVisitorCookie(response, session.id);
    return response;
  }
}
