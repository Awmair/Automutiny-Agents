import { createServerDatabaseClient } from "@automutiny/db";
import { IntakeReviewInputSchema } from "@automutiny/intake-brief-agent";
import { type NextRequest, NextResponse } from "next/server";

import { ReviewAccessError, reviewIntakeBrief } from "../../../../../lib/review-actions";
import { readVisitorSession } from "../../../../../lib/visitor-session";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ briefId: string }> },
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The request body must be valid JSON." }, { status: 400 });
  }
  const parsed = IntakeReviewInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "The review decision is invalid." },
      { status: 400 },
    );
  }

  const client = createServerDatabaseClient();
  const session = await readVisitorSession(request, client);
  if (!session) {
    return NextResponse.json(
      { error: "Run a scenario before reviewing an item." },
      { status: 403 },
    );
  }

  try {
    const { briefId } = await context.params;
    const result = await reviewIntakeBrief(client, briefId, parsed.data, session.id);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof ReviewAccessError ? 403 : 500;
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "The review decision could not be completed.",
      },
      { status },
    );
  }
}
