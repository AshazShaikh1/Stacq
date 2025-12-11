'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';
import { Header } from './Header';
import { LandingHeader } from '@/components/landing/LandingHeader'; // Assuming you have this
import { useAuth } from '@/contexts/AuthContext';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Pages that don't need any layout (Auth pages)
  const isAuthPage = pathname?.startsWith('/login') || 
                     pathname?.startsWith('/signup') || 
                     pathname?.startsWith('/reset-password');

  // Landing page logic (if not logged in and on home)
  const isLandingPage = !isLoading && !user && pathname === '/';

  if (isAuthPage) {
    return <main className="min-h-screen bg-white">{children}</main>;
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
    <div className="min-h-screen bg-cloud">
      
      {/* --- MOBILE ELEMENTS --- */}
      <MobileHeader />
      <MobileNav />

      {/* --- DESKTOP SIDEBAR --- */}
      {/* Hidden on mobile, Visible on desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* --- MAIN CONTENT WRAPPER --- */}
      {/* md:pl-16 -> Pushes content 4rem (64px) to right to match Sidebar width 
          pt-16 pb-20 -> Mobile padding for Top/Bottom bars
          md:pt-0 md:pb-0 -> Reset mobile padding on desktop
      */}
      <div className="min-h-screen transition-all duration-200 pt-16 pb-20 md:pt-0 md:pb-0 md:pl-16">
        
        {/* DESKTOP HEADER */}
        {/* Hidden on mobile, Visible on desktop */}
        <div className="hidden md:block sticky top-0 z-40">
          <Header />
        </div>

        <main className="h-full">
          {children}
        </main>
      </div>

    </div>
  );
}