import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SuppressMixpanelErrors } from "@/components/SuppressMixpanelErrors";

export const metadata: Metadata = {
  title: {
    default: "Stacq - Curated Resource Platform",
    template: "%s | Stacq",
  },
  description: "Discover and share curated resources with the community. Create collections, add cards, and explore high-quality content.",
  keywords: ["curated resources", "bookmarks", "collections", "cards", "community"],
  authors: [{ name: "Stacq Team" }],
  creator: "Stacq",
  publisher: "Stacq",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Stacq",
    title: "Stacq - Curated Resource Platform",
    description: "Discover and share curated resources with the community",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stacq - Curated Resource Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stacq - Curated Resource Platform",
    description: "Discover and share curated resources with the community",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SuppressMixpanelErrors />
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <LayoutWrapper>{children}</LayoutWrapper>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

