import { OperationalReviewPanel } from "@automutiny/agent-ui";
import { getOperationalCaseDetail } from "@automutiny/db";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { operationalAgentById } from "../../../lib/operational-agents";
import { visitorSessionCookieName } from "../../../lib/visitor-session";

export const dynamic = "force-dynamic";

export default async function OperationalReviewRoute({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const [detail, cookieStore] = await Promise.all([getOperationalCaseDetail(caseId), cookies()]);
  if (!detail) notFound();
  const agent = operationalAgentById(detail.agentId);
  if (!agent) notFound();
  const visitorSessionId = cookieStore.get(visitorSessionCookieName)?.value ?? null;
  const canReview =
    detail.visitorSessionId !== null && detail.visitorSessionId === visitorSessionId;
  const accounting = detail.agentId.startsWith("accounting-");

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
          <span className="queue-firm">
            {accounting ? "Accounting operations" : "Freight operations"}
          </span>
          <Link className="button button-small" href={agent.route}>
            {agent.name}
          </Link>
        </div>
      </header>
      <OperationalReviewPanel detail={detail} agent={agent} canReview={canReview} />
    </div>
  );
}
