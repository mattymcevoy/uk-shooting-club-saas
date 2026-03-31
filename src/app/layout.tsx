import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Breadcrumbs from "@/components/Breadcrumbs";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UK Shooting Club SaaS",
  description: "Membership, events, safety, compliance, and operations platform for shooting clubs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <Breadcrumbs />
          <main className="flex-1">
            {children}
          </main>
          <footer className="border-t border-white/10 py-6 px-6 text-sm text-gray-400">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
              <span>© {new Date().getFullYear()} UK Shooting Club SaaS</span>
              <div className="flex items-center gap-4">
                <Link href="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
                <Link href="/data-protection-policy" className="hover:text-emerald-400 transition-colors">Data Protection Policy</Link>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
