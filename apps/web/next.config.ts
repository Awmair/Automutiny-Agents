import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  outputFileTracingIncludes: {
    "/api/run/document": ["../../packages/agents/document-routing/fixtures/pdfs/**/*.pdf"],
  },
  transpilePackages: [
    "@automutiny/db",
    "@automutiny/agent-runtime",
    "@automutiny/agent-ui",
    "@automutiny/intake-brief-agent",
    "@automutiny/document-routing-agent",
    "@automutiny/stalled-work-agent",
    "@automutiny/accounting-document-chase-agent",
    "@automutiny/accounting-transaction-review-agent",
    "@automutiny/accounting-filing-readiness-agent",
    "@automutiny/logistics-load-exception-agent",
    "@automutiny/logistics-pod-verification-agent",
    "@automutiny/logistics-invoice-reconciliation-agent",
  ],
};

export default nextConfig;
