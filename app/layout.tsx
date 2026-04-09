import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://stacq.in'),
  title: {
    default: "Stacq — The Filter for a Noisy Internet",
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
            <div className="flex flex-col min-h-screen">
              <main className="flex-1">
                {children}
              </main>
              <footer className="w-full py-8 text-center text-sm font-bold text-muted-foreground flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-auto border-t border-border">
                  <p>© {new Date().getFullYear()} Stacq.in</p>
                  <a href="/about" className="hover:text-primary transition-colors cursor-pointer">About</a>
                  <a href="/terms" className="hover:text-primary transition-colors cursor-pointer">Terms</a>
                  <a href="/privacy" className="hover:text-primary transition-colors cursor-pointer">Privacy</a>
                  <a href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact</a>
                  <a href="/report" className="hover:text-primary transition-colors cursor-pointer">Report Issue</a>
              </footer>
            </div>
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
