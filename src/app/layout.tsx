import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const localFontVars: CSSProperties = {
  ["--font-geist-sans" as string]:
    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  ["--font-geist-mono" as string]:
    "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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
      <head>
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" 
        />
      </head>
      <body style={localFontVars} className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
