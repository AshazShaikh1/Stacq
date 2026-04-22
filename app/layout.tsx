import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { GlobalFooter } from "@/components/layout/global-footer";
import { MobileCTABar } from "@/components/layout/mobile-cta-bar";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PostHogProvider } from "@/components/analytics/posthog-provider";
import { WebVitalsLogger } from "@/components/analytics/web-vitals-logger";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://stacq.in"),
  title: {
    default:
      "Stacq — Expert-curated resource lists, built by people not algorithms",
    template: "%s | Stacq",
  },
  description:
    "Stacq is a tool for saving and sharing curated resource lists. Find expert-picked tools, articles, and links — built by practitioners, not algorithms.",
  openGraph: {
    type: "website",
    url: "https://stacq.in",
    title: "Stacq — Expert-curated resource lists",
    description:
      "Find curated resource lists built by real people. Save and share the tools, articles, and links that actually work.",
    siteName: "Stacq",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stacq — Expert-curated resource lists",
    description:
      "Find curated resource lists built by real people. Save and share the tools, articles, and links that actually work.",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: {
      url: "/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
    other: [{ rel: "manifest", url: "/manifest.json" }],
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
        {/* Organization JSON-LD — Google uses this for the site logo in search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Stacq",
              url: "https://stacq.in",
              logo: "https://stacq.in/icon-192x192.png",
              sameAs: ["https://stacq.in"],
            }),
          }}
        />
        <PostHogProvider>
          <AuthProvider initialSession={null}>
            <Toaster
              position="bottom-center"
              toastOptions={{
                className:
                  "rounded-2xl shadow-xl border border-border bg-surface text-foreground font-bold px-4 py-3 scale-95 md:scale-100",
              }}
            />
            <Navbar />
            <Sidebar />
            <AppShell>
              <div className="flex flex-col min-h-dvh pb-[60px] md:pb-0">
                <main className="flex-1">{children}</main>
                <GlobalFooter />
              </div>
            </AppShell>
            <MobileCTABar />
            <WebVitalsLogger />
            <Analytics />
            <SpeedInsights />
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
