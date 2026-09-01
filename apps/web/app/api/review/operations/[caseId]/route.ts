import { OperationalReviewInputSchema } from "@automutiny/agent-runtime";
import { createServerDatabaseClient } from "@automutiny/db";
import { type NextRequest, NextResponse } from "next/server";

import { ReviewAccessError, reviewOperationalCase } from "../../../../../lib/review-actions";
import { readVisitorSession } from "../../../../../lib/visitor-session";

export async function POST(request: NextRequest, context: { params: Promise<{ caseId: string }> }) {
  const parsed = OperationalReviewInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review decision." },
      { status: 400 },
    );
  }
  const client = createServerDatabaseClient();
  const session = await readVisitorSession(request, client);
  if (!session) {
    return NextResponse.json({ error: "Run a scenario before reviewing it." }, { status: 403 });
  }
  try {
    return NextResponse.json(
      await reviewOperationalCase(client, (await context.params).caseId, parsed.data, session.id),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The review failed." },
      { status: error instanceof ReviewAccessError ? 403 : 500 },
    );
  }
}
