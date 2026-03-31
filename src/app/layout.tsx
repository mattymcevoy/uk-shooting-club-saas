import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "UK Shooting Club",
  description: "Next-gen B2B shooting club SaaS",
  manifest: "/manifest.json"
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
          
          {/* PWA offline caching service worker deployment */}
          <script dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg){ console.log('SW registration successful with scope: ', reg.scope); },
                    function(err){ console.log('SW registration failed: ', err); }
                  );
                });
              }
            `
          }} />
        </AuthProvider>
      </body>
    </html>
  );
}
