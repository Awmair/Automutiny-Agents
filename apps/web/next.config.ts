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
    "@automutiny/intake-brief-agent",
    "@automutiny/document-routing-agent",
    "@automutiny/stalled-work-agent",
  ],
};

export default nextConfig;
