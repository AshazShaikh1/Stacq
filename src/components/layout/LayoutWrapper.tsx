'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { LandingHeader } from '@/components/landing/LandingHeader';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const supabase = createClient();
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
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

