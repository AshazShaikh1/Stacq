import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";

// Components
import ErrorBoundary from "@/components/ErrorBoundary";
import { SuppressMixpanelErrors } from "@/components/SuppressMixpanelErrors";
import { checkOnboardingStatus } from "@/lib/auth/server-gate";

// Contexts
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: "Stacq - Curated Resource Platform",
    template: "%s | Stacq",
  },
  description: "Discover and share curated resources with the community.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Removed global checkOnboardingStatus(); let middleware handle protection.
  return (
    <html lang="en">
      <body className={inter.className}>
        <SuppressMixpanelErrors />
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              {/* Layout handling is now moved to (main) and (marketing) route groups */}
              {children}
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}