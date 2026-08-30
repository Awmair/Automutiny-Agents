import { createServerDatabaseClient } from "@automutiny/db";
import { StalledRunInputSchema, submitStalledRun } from "@automutiny/stalled-work-agent";
import { type NextRequest, NextResponse } from "next/server";
import {
  attachVisitorCookie,
  consumeVisitorRun,
  VisitorRateLimitError,
} from "../../../../lib/visitor-session";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const parsed = StalledRunInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid clock advance." },
      { status: 400 },
    );
  const client = createServerDatabaseClient();
  let session: Awaited<ReturnType<typeof consumeVisitorRun>> | null = null;
  try {
    session = await consumeVisitorRun(request, client);
    const result = await submitStalledRun(parsed.data.advance_days, {
      client,
      visitorSessionId: session.id,
    });
    const response = NextResponse.json(result);
    if (session.setCookie) attachVisitorCookie(response, session.id);
    return response;
  } catch (error) {
    const response = NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The Stalled Work Agent could not complete this run.",
      },
      { status: error instanceof VisitorRateLimitError ? 429 : 500 },
    );
    if (session?.setCookie) attachVisitorCookie(response, session.id);
    return response;
  }
}
