import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const localFontVars: CSSProperties = {
  ["--font-geist-sans" as string]:
    "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
  ["--font-geist-mono" as string]:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
};

export const metadata: Metadata = {
  title: "MM Maker - Minit & OPR Generator",
  description: "Penjana dokumen Minit Mesyuarat dan One Page Report (OPR).",
  keywords: ["MM Maker", "Minit Mesyuarat", "OPR", "Next.js", "TypeScript"],
  authors: [{ name: "MM Maker" }],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "MM Maker - Minit & OPR Generator",
    description: "Penjana dokumen Minit Mesyuarat dan One Page Report (OPR).",
    siteName: "MM Maker",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "MM Maker - Minit & OPR Generator",
    description: "Penjana dokumen Minit Mesyuarat dan One Page Report (OPR).",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={localFontVars} className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
