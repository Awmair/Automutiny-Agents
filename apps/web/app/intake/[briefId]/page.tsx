import { getIntakeReviewDetail } from "@automutiny/intake-brief-agent";
import { IntakeReviewPanel } from "@automutiny/intake-brief-agent/ui";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { visitorSessionCookieName } from "../../../lib/visitor-session";

export const dynamic = "force-dynamic";

export default async function IntakeReviewRoute({
  params,
}: {
  params: Promise<{ briefId: string }>;
}) {
  const { briefId } = await params;
  const [detail, cookieStore] = await Promise.all([getIntakeReviewDetail(briefId), cookies()]);
  if (!detail) notFound();
  const visitorSessionId = cookieStore.get(visitorSessionCookieName)?.value ?? null;
  const canReview =
    detail.visitorSessionId !== null && detail.visitorSessionId === visitorSessionId;

  return (
    <div className="site-shell detail-site-shell">
      <header className="site-header">
        <div className="header-inner queue-header-inner">
          <Link className="brand" href="/" aria-label="Automutiny agents home">
            <span className="brand-mark" aria-hidden="true">
              <i />
            </span>
            <span className="brand-type">
              <b>auto</b>
              <i />
              <strong>mutiny</strong>
            </span>
          </Link>
          <span className="queue-firm">Briar &amp; Calder LLP</span>
          <Link className="button button-small" href="/intake">
            Intake queue
          </Link>
        </div>
      </header>
      <IntakeReviewPanel detail={detail} canReview={canReview} />
    </div>
  );
}
