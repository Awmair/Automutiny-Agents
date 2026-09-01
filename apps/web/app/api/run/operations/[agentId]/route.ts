import {
  createServerDatabaseClient,
  type OperationalAgentId,
  operationalAgentIds,
} from "@automutiny/db";
import { type NextRequest, NextResponse } from "next/server";

import { submitOperationalAgent } from "../../../../../lib/operational-agents";
import {
  attachVisitorCookie,
  consumeVisitorRun,
  VisitorRateLimitError,
} from "../../../../../lib/visitor-session";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ agentId: string }> },
) {
  const body = (await request.json().catch(() => null)) as { scenario_id?: unknown } | null;
  if (!body || typeof body.scenario_id !== "string" || !body.scenario_id.trim()) {
    return NextResponse.json({ error: "Choose a valid scenario." }, { status: 400 });
  }
  const { agentId: rawAgentId } = await context.params;
  if (!operationalAgentIds.includes(rawAgentId as OperationalAgentId)) {
    return NextResponse.json({ error: "Unknown operational agent." }, { status: 404 });
  }

  const client = createServerDatabaseClient();
  let session: Awaited<ReturnType<typeof consumeVisitorRun>> | null = null;
  try {
    session = await consumeVisitorRun(request, client);
    const result = await submitOperationalAgent(
      rawAgentId as OperationalAgentId,
      body.scenario_id,
      {
        client,
        visitorSessionId: session.id,
      },
    );
    const response = NextResponse.json(result);
    if (session.setCookie) attachVisitorCookie(response, session.id);
    return response;
  } catch (error) {
    const response = NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The operational agent could not complete this run.",
      },
      { status: error instanceof VisitorRateLimitError ? 429 : 500 },
    );
    if (session?.setCookie) attachVisitorCookie(response, session.id);
    return response;
  }
}
