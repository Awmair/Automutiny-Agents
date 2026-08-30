import { createServerDatabaseClient } from "@automutiny/db";
import { runStalledWork } from "@automutiny/stalled-work-agent";
import { type NextRequest, NextResponse } from "next/server";
import { configuredFirmName } from "../../../../lib/config";
import { purgeExpiredVisitorData } from "../../../../lib/maintenance";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Scheduled maintenance is not configured." },
      { status: 503 },
    );
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const client = createServerDatabaseClient();
    const maintenance = await purgeExpiredVisitorData(client);
    const firm = await client.from("firms").select("id").eq("name", configuredFirmName()).single();
    if (firm.error) throw firm.error;
    const report = await runStalledWork(firm.data.id, new Date(), {
      client,
      visitorSessionId: null,
    });
    return NextResponse.json({ status: "ok", maintenance, report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduled maintenance failed." },
      { status: 500 },
    );
  }
}
