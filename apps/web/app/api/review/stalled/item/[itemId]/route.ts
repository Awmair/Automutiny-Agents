import { createServerDatabaseClient } from "@automutiny/db";
import { StalledItemReviewSchema } from "@automutiny/stalled-work-agent";
import { type NextRequest, NextResponse } from "next/server";
import { ReviewAccessError, reviewStalledItem } from "../../../../../../lib/review-actions";
import { readVisitorSession } from "../../../../../../lib/visitor-session";
export async function POST(request: NextRequest, context: { params: Promise<{ itemId: string }> }) {
  const parsed = StalledItemReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid decision." },
      { status: 400 },
    );
  const client = createServerDatabaseClient();
  const session = await readVisitorSession(request, client);
  if (!session)
    return NextResponse.json({ error: "Run a scan before reviewing an item." }, { status: 403 });
  try {
    return NextResponse.json(
      await reviewStalledItem(client, (await context.params).itemId, parsed.data, session.id),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Decision failed." },
      { status: error instanceof ReviewAccessError ? 403 : 500 },
    );
  }
}
