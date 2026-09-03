import type { Metadata } from "next";
import type { ReactNode } from "react";

import { StructuredData } from "../components/structured-data";
import { ORGANIZATION_ID, SITE_URL, WEBSITE_ID } from "../lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AI Agents for Accounting, Legal and Logistics | Automutiny",
    template: "%s | Automutiny",
  },
  description:
    "Explore live AI agents for accounting firms, law firms and logistics teams. Test focused workflows with visible evidence and human approval.",
  openGraph: {
    title: "AI Agents for Accounting, Legal and Logistics | Automutiny",
    description:
      "Nine focused AI agents for accounting, legal and logistics workflows. Agents prepare. Humans decide.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Agents for Accounting, Legal and Logistics | Automutiny",
    description:
      "Nine focused AI agents for accounting, legal and logistics workflows. Agents prepare. Humans decide.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <StructuredData
          id="automutiny-live-agents-schema"
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "@id": ORGANIZATION_ID,
                name: "Automutiny",
                url: "https://automutiny.com/",
                description:
                  "AI implementation for mid-market firms, built around focused workflows and human authority.",
              },
              {
                "@type": "WebSite",
                "@id": WEBSITE_ID,
                url: `${SITE_URL}/`,
                name: "Automutiny Live Agents",
                description:
                  "Live AI agents for accounting, legal and logistics workflows with visible evidence and human approval.",
                publisher: { "@id": ORGANIZATION_ID },
              },
            ],
          }}
        />
        {children}
      </body>
    </html>
  );
}
