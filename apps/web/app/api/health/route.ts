import { createServerDatabaseClient } from "@automutiny/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(
    process.env.SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) &&
      (process.env.MODEL_PROVIDER === "mock" || process.env.GROQ_API_KEY),
  );
  if (!configured) {
    return NextResponse.json({ status: "not_configured" }, { status: 503 });
  }
  try {
    const result = await createServerDatabaseClient()
      .from("firms")
      .select("id", { count: "exact", head: true });
    if (result.error) throw result.error;
    return NextResponse.json({ status: "ok", database: "reachable" });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
}
