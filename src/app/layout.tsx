import type { Metadata } from "next";

import { Providers } from "@/components/Providers";

import "@fontsource-variable/dm-sans";
import "@fontsource/jetbrains-mono";
import "./globals.css";

/** Avoid static prerender with Clerk (invalid/missing keys break `next build`). */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Git Mastery",
  description: "Learn Git with hands-on challenges",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-body">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
