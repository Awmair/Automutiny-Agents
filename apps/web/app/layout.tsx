import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Automutiny Agents",
    template: "%s | Automutiny",
  },
  description:
    "Lean, cost-controlled AI agents for accounting, legal and logistics workflows. Agents prepare. Humans decide.",
  openGraph: {
    title: "Automutiny Agents",
    description: "Lean agents that do real work. Humans stay in control.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Automutiny Agents",
    description: "Lean agents that do real work. Humans stay in control.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
