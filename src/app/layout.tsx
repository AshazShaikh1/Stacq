import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: {
    default: "Stack - Curated Resource Platform",
    template: "%s | Stack",
  },
  description: "Discover and share curated resources with the community. Create stacks, add cards, and explore high-quality content.",
  keywords: ["curated resources", "bookmarks", "collections", "stacks", "cards", "community"],
  authors: [{ name: "Stack Team" }],
  creator: "Stack",
  publisher: "Stack",
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
    siteName: "Stack",
    title: "Stack - Curated Resource Platform",
    description: "Discover and share curated resources with the community",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stack - Curated Resource Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stack - Curated Resource Platform",
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
        <ErrorBoundary>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}

