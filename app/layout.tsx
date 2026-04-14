import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { GlobalFooter } from "@/components/layout/global-footer";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://stacq.in'),
  title: {
    default: "Stacq — The Expert Filter for the Digital Age",
    template: "%s | Stacq"
  },
  description: "Stop searching and start finding. Stacq helps you curate the high-signal resources that Google and AI often miss.",
  openGraph: {
    type: "website",
    url: "https://stacq.in",
    title: "Stacq",
    description: "Stop searching and start finding. Stacq helps you curate the high-signal resources that Google and AI often miss.",
    siteName: "Stacq",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stacq",
    description: "Stop searching and start finding. Stacq helps you curate the high-signal resources that Google and AI often miss.",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
};


// Non-blocking layout: passes null as initialSession so the page tree
// renders immediately. The AuthProvider hydrates session client-side.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <AuthProvider initialSession={null}>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              className: 'rounded-2xl shadow-xl border border-border bg-surface text-foreground font-bold px-4 py-3 scale-95 md:scale-100',
            }}
          />
          <Navbar />
          <Sidebar />
          <AppShell>
            <div className="flex flex-col min-h-dvh">
              <main className="flex-1">
                {children}
              </main>
              <GlobalFooter />
            </div>
          </AppShell>
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
