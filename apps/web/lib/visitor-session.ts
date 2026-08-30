import { createHash, randomUUID } from "node:crypto";
import { createServerDatabaseClient } from "@automutiny/db";
import type { NextRequest, NextResponse } from "next/server";

export const visitorSessionCookieName = "visitor_session_id";
type ServerDatabaseClient = ReturnType<typeof createServerDatabaseClient>;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export class VisitorRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VisitorRateLimitError";
  }
}

type SessionRow = {
  id: string;
  runs_today: number;
  run_day: string;
};

function requestAddress(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local"
  );
}

function hashAddress(request: NextRequest) {
  const salt =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "local-development";
  return createHash("sha256")
    .update(`${salt}:${requestAddress(request)}`)
    .digest("hex");
}

async function existingSession(
  request: NextRequest,
  client: ServerDatabaseClient,
): Promise<SessionRow | null> {
  const cookieId = request.cookies.get(visitorSessionCookieName)?.value;
  if (!cookieId || !uuidPattern.test(cookieId)) return null;
  const result = await client
    .from("visitor_sessions")
    .select("id, runs_today, run_day")
    .eq("id", cookieId)
    .maybeSingle();
  if (result.error) throw new Error(`Could not load visitor session: ${result.error.message}`);
  return (result.data as SessionRow | null) ?? null;
}

export async function readVisitorSession(
  request: NextRequest,
  client: ServerDatabaseClient = createServerDatabaseClient(),
) {
  return existingSession(request, client);
}

export async function consumeVisitorRun(
  request: NextRequest,
  client: ServerDatabaseClient = createServerDatabaseClient(),
) {
  const today = new Date().toISOString().slice(0, 10);
  const globalLimit = Number(process.env.DAILY_GLOBAL_RUN_CAP ?? "200");
  const sessionLimit = Number(process.env.SESSION_RUN_CAP ?? "10");
  const globalResult = await client
    .from("agent_runs")
    .select("id", { count: "exact", head: true })
    .not("visitor_session_id", "is", null)
    .gte("started_at", `${today}T00:00:00.000Z`);
  if (globalResult.error)
    throw new Error(`Could not check the global run limit: ${globalResult.error.message}`);
  if ((globalResult.count ?? 0) >= globalLimit) {
    throw new VisitorRateLimitError("The daily run limit has been reached.");
  }

  const session = await existingSession(request, client);
  if (session) {
    const runsToday = session.run_day === today ? session.runs_today : 0;
    if (runsToday >= sessionLimit) {
      throw new VisitorRateLimitError(
        `This visitor session has reached its ${sessionLimit}-run daily limit.`,
      );
    }
    const updateResult = await client
      .from("visitor_sessions")
      .update({
        runs_today: runsToday + 1,
        run_day: today,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", session.id);
    if (updateResult.error)
      throw new Error(`Could not update visitor session: ${updateResult.error.message}`);
    return { id: session.id, setCookie: false };
  }

  const id = randomUUID();
  const insertResult = await client.from("visitor_sessions").insert({
    id,
    ip_hash: hashAddress(request),
    runs_today: 1,
    run_day: today,
  });
  if (insertResult.error)
    throw new Error(`Could not create visitor session: ${insertResult.error.message}`);
  return { id, setCookie: true };
}

export function attachVisitorCookie(response: NextResponse, sessionId: string) {
  response.cookies.set(visitorSessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
}
