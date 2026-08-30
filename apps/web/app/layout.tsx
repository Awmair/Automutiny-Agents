import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Legal Operations Agents | Automutiny",
  description:
    "Three inspectable AI agents that prepare legal operations work and stop for human decisions.",
  openGraph: {
    title: "Legal Operations Agents | Automutiny",
    description: "Three inspectable agents. Human authority over every decision.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Legal Operations Agents | Automutiny",
    description: "Three inspectable agents. Human authority over every decision.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
