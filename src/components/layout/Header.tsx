'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function Header() {
  const router = useRouter();
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-light">
      <div className="container mx-auto px-page">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-h2 font-bold text-jet-dark">
            Stack
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link
                  href="/feed"
                  className="text-body text-jet-dark hover:text-jet transition-colors"
                >
                  Feed
                </Link>
                <Link
                  href="/explore"
                  className="text-body text-jet-dark hover:text-jet transition-colors"
                >
                  Explore
                </Link>
                <Link
                  href={`/profile/${user.id}`}
                  className="text-body text-jet-dark hover:text-jet transition-colors"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/explore"
                  className="text-body text-jet-dark hover:text-jet transition-colors"
                >
                  Explore
                </Link>
              </>
            )}
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-20 h-10 bg-gray-light animate-pulse rounded-button" />
            ) : user ? (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button variant="primary" size="sm">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

