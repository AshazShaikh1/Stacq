'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { LandingHeader } from '@/components/landing/LandingHeader';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  
  // Hide sidebar and header on auth pages
  const isAuthPage = pathname?.startsWith('/login') || 
                     pathname?.startsWith('/signup') || 
                     pathname?.startsWith('/reset-password');

  // Show landing page layout when not signed in and on home page
  const isLandingPage = !isLoading && !user && pathname === '/';

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  if (isLandingPage) {
    return (
      <div className="min-h-screen">
        <LandingHeader />
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-16">
        <Header />
        <main>{children}</main>
      </div>
    </div>
  );
}

