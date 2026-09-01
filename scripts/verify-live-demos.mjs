const baseUrl = (process.env.LIVE_DEMO_URL ?? "https://agents.automutiny.com").replace(/\/$/u, "");

const workflows = [
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

for (const [agentId, scenarioId, route] of workflows) {
  const page = await request(route);
  if (page.status !== 200) throw new Error(`${agentId} queue returned ${page.status}.`);

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

console.log(`PASS all ${workflows.length} live workflows at ${baseUrl}`);
