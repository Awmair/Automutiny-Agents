export const SITE_URL = "https://agents.automutiny.com";

export const ORGANIZATION_ID = "https://automutiny.com/#organization";
export const WEBSITE_ID = `${SITE_URL}/#website`;

export const publicRoutes = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/accounting", changeFrequency: "weekly", priority: 0.9 },
  { path: "/legal", changeFrequency: "weekly", priority: 0.9 },
  { path: "/logistics", changeFrequency: "weekly", priority: 0.9 },
  { path: "/accounting/document-chase", changeFrequency: "weekly", priority: 0.8 },
  { path: "/accounting/transaction-review", changeFrequency: "weekly", priority: 0.8 },
  { path: "/accounting/filing-readiness", changeFrequency: "weekly", priority: 0.8 },
  { path: "/intake", changeFrequency: "weekly", priority: 0.8 },
  { path: "/documents", changeFrequency: "weekly", priority: 0.8 },
  { path: "/stalled", changeFrequency: "weekly", priority: 0.8 },
  { path: "/logistics/load-exception", changeFrequency: "weekly", priority: 0.8 },
  { path: "/logistics/pod-verification", changeFrequency: "weekly", priority: 0.8 },
  { path: "/logistics/invoice-reconciliation", changeFrequency: "weekly", priority: 0.8 },
] as const;

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}
