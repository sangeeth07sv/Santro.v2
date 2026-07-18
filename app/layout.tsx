import type { Metadata } from "next";
import { Suspense } from "react";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { NavShell, NavShellSkeleton } from "@/components/layout/NavShell";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-display" });
const body = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "SANTRO — Everything, sorted.", template: "%s | SANTRO" },
  description: "Fashion, electronics, home & daily essentials — one cart, one checkout, delivered fast across India.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <Suspense fallback={<NavShellSkeleton />}>
          <NavShell />
        </Suspense>
        <main className="min-h-[70vh] pb-20 md:pb-0">{children}</main>
        <footer className="mt-16 bg-indigo-800 py-12 pb-24 text-sm text-indigo-100 md:pb-12">
          <div className="mx-auto max-w-7xl px-4">
            <p className="font-display text-lg text-white">SANTRO</p>
            <p className="mt-1 text-indigo-300">Everything, sorted. Delivered across India.</p>
            <p className="mt-6 text-xs text-indigo-400">© {new Date().getFullYear()} SANTRO. All rights reserved.</p>
          </div>
        </footer>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
