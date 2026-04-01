import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import Sidebar from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";
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
  title: "Stacq",
  description: "The Filter for a Noisy Internet",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <AuthProvider initialSession={session}>
          <Toaster position="top-center" richColors closeButton />
          <Navbar />
          {session && <Sidebar />}
          <div className={session ? "md:ml-20 lg:ml-64 pb-16 md:pb-0" : "max-w-7xl mx-auto w-full"}>
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
