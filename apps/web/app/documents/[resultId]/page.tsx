import { getDocumentReviewDetail } from "@automutiny/document-routing-agent";
import { DocumentReviewPanel } from "@automutiny/document-routing-agent/ui";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { visitorSessionCookieName } from "../../../lib/visitor-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function DocumentReviewPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = await params;
  const [detail, cookieStore] = await Promise.all([getDocumentReviewDetail(resultId), cookies()]);
  if (!detail) notFound();
  const canReview =
    detail.document.visitor_session_id !== null &&
    detail.document.visitor_session_id === cookieStore.get(visitorSessionCookieName)?.value;
  return (
    <div className="site-shell detail-site-shell">
      <header className="site-header">
        <div className="header-inner queue-header-inner">
          <Link className="brand" href="/">
            Automutiny
          </Link>
          <span className="queue-firm">Briar &amp; Calder LLP</span>
          <Link className="button button-small" href="/documents">
            Document queue
          </Link>
        </div>
      </header>
      <DocumentReviewPanel detail={detail} canReview={canReview} />
    </div>
  );
}
