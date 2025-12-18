'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CollectionGridSkeleton } from '@/components/ui/Skeleton';

/**
 * When the server renders the landing page (signed-out),
 * but the client auth state already has a user (just signed in),
 * hide the marketing landing and show a neutral skeleton instead.
 */
export function LandingSignedInGuard() {
  const { user, isLoading } = useAuth();
  const [shouldOverlay, setShouldOverlay] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      // User is signed in on client, but server rendered landing.
      setShouldOverlay(true);
    }
  }, [user, isLoading]);

  if (!shouldOverlay) return null;

  return (
    <div className="fixed inset-0 z-50 bg-cloud">
      <div className="container mx-auto px-4 md:px-page py-8">
        <CollectionGridSkeleton count={12} />
      </div>
    </div>
  );
}

