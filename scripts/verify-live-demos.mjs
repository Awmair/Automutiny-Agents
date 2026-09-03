const baseUrl = (process.env.LIVE_DEMO_URL ?? "https://agents.automutiny.com").replace(/\/$/u, "");

const operationalWorkflows = [
  ["accounting-document-chase", "mesa-dental-return", "/accounting/document-chase"],
  ["accounting-transaction-review", "riverbend-august", "/accounting/transaction-review"],
  ["accounting-filing-readiness", "harbor-works-blocked", "/accounting/filing-readiness"],
  ["logistics-load-exception", "load-4821-critical", "/logistics/load-exception"],
  ["logistics-pod-verification", "pod-4821-damage", "/logistics/pod-verification"],
  [
    "logistics-invoice-reconciliation",
    "invoice-8821-variance",
    "/logistics/invoice-reconciliation",
  ],
];

let cookie = "";

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers, redirect: "manual" });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";", 1)[0] ?? cookie;
  return response;
}

async function verifyAgentPage(agentId, route) {
  const page = await request(route);
  if (page.status !== 200) throw new Error(`${agentId} queue returned ${page.status}.`);
  const pageBody = await page.text();
  if (!pageBody.includes("Test it live")) {
    throw new Error(`${agentId} queue is missing the live-test CTA.`);
  }
}

await verifyAgentPage("intake-brief", "/intake");
const intakeRun = await request("/api/run/intake", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    name: "Jordan Ellis",
    email: "jordan.ellis@example.com",
    phone: "+1 213 555 0141",
    company: "",
    matter_description:
      "On August 18, 2026, a delivery truck ran a red light in Los Angeles and struck my car. I had surgery for a fractured wrist, remain in treatment, and have the police report and insurance claim number. My medical bills are about $38,000 and I have missed four weeks of work. I have not hired another lawyer.",
    how_found_us: "Former client referral",
    urgency: "Treatment is ongoing; no court or agency notice received.",
  }),
});
const intakeBody = await intakeRun.json();
if (intakeRun.status !== 200 || !intakeBody.briefId) {
  throw new Error(
    `intake-brief run failed (${intakeRun.status}): ${intakeBody.error ?? "missing brief id"}`,
  );
}
const intakeDetail = await request(`/intake/${intakeBody.briefId}`);
if (intakeDetail.status !== 200) {
  throw new Error(`intake-brief result page returned ${intakeDetail.status}.`);
}
const intakeReview = await request(`/api/review/intake/${intakeBody.briefId}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ decision: "approve" }),
});
const intakeReviewBody = await intakeReview.json();
if (
  intakeReview.status !== 200 ||
  intakeReviewBody.briefStatus !== "approved" ||
  intakeReviewBody.outboxQueued !== true
) {
  throw new Error(
    `intake-brief review failed (${intakeReview.status}): ${intakeReviewBody.error ?? "invalid result"}`,
  );
}
console.log("PASS intake-brief: run, result page, and saved human decision");

await verifyAgentPage("document-routing", "/documents");
const documentForm = new FormData();
documentForm.set("scenario", "price-medical-bill");
const documentRun = await request("/api/run/document", {
  method: "POST",
  body: documentForm,
});
const documentBody = await documentRun.json();
if (documentRun.status !== 200 || !documentBody.resultId) {
  throw new Error(
    `document-routing run failed (${documentRun.status}): ${documentBody.error ?? "missing result id"}`,
  );
}
const documentDetail = await request(`/documents/${documentBody.resultId}`);
if (documentDetail.status !== 200) {
  throw new Error(`document-routing result page returned ${documentDetail.status}.`);
}
const documentReview = await request(`/api/review/document/${documentBody.resultId}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ decision: "approve" }),
});
const documentReviewBody = await documentReview.json();
if (documentReview.status !== 200 || documentReviewBody.status !== "approved") {
  throw new Error(
    `document-routing review failed (${documentReview.status}): ${documentReviewBody.error ?? "invalid result"}`,
  );
}
console.log("PASS document-routing: run, result page, and saved human decision");

await verifyAgentPage("stalled-work", "/stalled");
const stalledRun = await request("/api/run/stalled", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ advance_days: 30 }),
});
const stalledBody = await stalledRun.json();
if (stalledRun.status !== 200 || !stalledBody.reportId) {
  throw new Error(
    `stalled-work run failed (${stalledRun.status}): ${stalledBody.error ?? "missing report id"}`,
  );
}
const stalledDetail = await request(`/stalled/${stalledBody.reportId}`);
if (stalledDetail.status !== 200) {
  throw new Error(`stalled-work result page returned ${stalledDetail.status}.`);
}
const stalledReview = await request(`/api/review/stalled/report/${stalledBody.reportId}`, {
  method: "POST",
});
const stalledReviewBody = await stalledReview.json();
if (stalledReview.status !== 200 || stalledReviewBody.status !== "reviewed") {
  throw new Error(
    `stalled-work review failed (${stalledReview.status}): ${stalledReviewBody.error ?? "invalid result"}`,
  );
}
console.log("PASS stalled-work: run, result page, and saved human decision");

for (const [agentId, scenarioId, route] of operationalWorkflows) {
  await verifyAgentPage(agentId, route);

  const run = await request(`/api/run/operations/${agentId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scenario_id: scenarioId }),
  });
  const runBody = await run.json();
  if (run.status !== 200 || !runBody.caseId) {
    throw new Error(`${agentId} run failed (${run.status}): ${runBody.error ?? "missing case id"}`);
  }

  const detail = await request(`/operations/${runBody.caseId}`);
  if (detail.status !== 200) throw new Error(`${agentId} result page returned ${detail.status}.`);

  const review = await request(`/api/review/operations/${runBody.caseId}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ decision: "approve" }),
  });
  const reviewBody = await review.json();
  if (
    review.status !== 200 ||
    reviewBody.status !== "approved" ||
    reviewBody.externalActionTaken !== false
  ) {
    throw new Error(
      `${agentId} review failed (${review.status}): ${reviewBody.error ?? "invalid result"}`,
    );
  }

  console.log(`PASS ${agentId}: run, result page, and saved human decision`);
}

console.log(`PASS all ${operationalWorkflows.length + 3} live workflows at ${baseUrl}`);
