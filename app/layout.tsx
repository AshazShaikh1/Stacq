import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stacq — The Filter for a Noisy Internet",
  description: "Build and discover human-curated resource collections on Stacq.",
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
          <Toaster position="top-center" richColors closeButton />
          <Navbar />
          <Sidebar />
          <div className="md:ml-20 lg:ml-64 pb-32 md:pb-0 min-h-screen">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
