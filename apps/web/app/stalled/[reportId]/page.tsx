import { getStalledReportDetail } from "@automutiny/stalled-work-agent";
import { StalledReviewPanel } from "@automutiny/stalled-work-agent/ui";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { visitorSessionCookieName } from "../../../lib/visitor-session";
export const dynamic = "force-dynamic";
export default async function StalledReportPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const [detail, cookieStore] = await Promise.all([getStalledReportDetail(reportId), cookies()]);
  if (!detail) notFound();
  const canReview =
    detail.report.visitor_session_id !== null &&
    detail.report.visitor_session_id === cookieStore.get(visitorSessionCookieName)?.value;
  return (
    <div className="site-shell detail-site-shell">
      <header className="site-header">
        <div className="header-inner queue-header-inner">
          <Link className="brand" href="/">
            Automutiny
          </Link>
          <span className="queue-firm">Briar &amp; Calder LLP</span>
          <Link className="button button-small" href="/stalled">
            Stalled queue
          </Link>
        </div>
      </header>
      <StalledReviewPanel detail={detail} canReview={canReview} />
    </div>
  );
}
