import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@automutiny/db",
    "@automutiny/agent-runtime",
    "@automutiny/intake-brief-agent",
    "@automutiny/document-routing-agent",
    "@automutiny/stalled-work-agent",
  ],
};

export default nextConfig;
