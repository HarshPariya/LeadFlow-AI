import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "LeadFlow AI — Intelligent CRM & Sales Automation Platform",
  description:
    "Capture leads, qualify them with AI, synchronize Twenty CRM records, route high-priority opportunities, and automate cross-platform follow-ups with Zapier.",
  keywords: [
    "CRM",
    "Sales Automation",
    "Lead Qualification",
    "Zapier",
    "Twenty CRM",
    "Groq AI",
    "B2B SaaS",
  ],
  authors: [{ name: "LeadFlow AI Team" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#F9F8F5] text-[#1C1B18] selection:bg-[#F6EDE3] selection:text-[#8D5B28]">
        {children}
      </body>
    </html>
  );
}
