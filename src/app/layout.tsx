import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";

export const metadata: Metadata = {
  title: "Stack - Curated Resource Platform",
  description: "Discover and share curated resources with the community",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}

