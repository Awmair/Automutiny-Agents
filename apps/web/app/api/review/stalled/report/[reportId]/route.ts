import { createServerDatabaseClient } from "@automutiny/db";
import { type NextRequest, NextResponse } from "next/server";
import { markStalledReportReviewed, ReviewAccessError } from "../../../../../../lib/review-actions";
import { readVisitorSession } from "../../../../../../lib/visitor-session";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reportId: string }> },
) {
  const client = createServerDatabaseClient();
  const session = await readVisitorSession(request, client);
  if (!session)
    return NextResponse.json({ error: "Run a scan before reviewing it." }, { status: 403 });
  try {
    return NextResponse.json(
      await markStalledReportReviewed(client, (await context.params).reportId, session.id),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed." },
      { status: error instanceof ReviewAccessError ? 403 : 500 },
    );
  }
}
