import { createServerDatabaseClient } from "@automutiny/db";
import { DocumentReviewInputSchema } from "@automutiny/document-routing-agent";
import { type NextRequest, NextResponse } from "next/server";
import { ReviewAccessError, reviewDocumentResult } from "../../../../../lib/review-actions";
import { readVisitorSession } from "../../../../../lib/visitor-session";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ resultId: string }> },
) {
  const parsed = DocumentReviewInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review." },
      { status: 400 },
    );
  const client = createServerDatabaseClient();
  const session = await readVisitorSession(request, client);
  if (!session)
    return NextResponse.json(
      { error: "Run a scenario before reviewing an item." },
      { status: 403 },
    );
  try {
    return NextResponse.json(
      await reviewDocumentResult(client, (await context.params).resultId, parsed.data, session.id),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed." },
      { status: error instanceof ReviewAccessError ? 403 : 500 },
    );
  }
}
