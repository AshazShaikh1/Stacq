'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function SavedCollectionsClient() {
  const router = useRouter();

  useEffect(() => {
    // Refresh the page data when component mounts or becomes visible
    // This ensures the saved page shows the latest data after saving
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };

    const handleFocus = () => {
      router.refresh();
    };

    // Refresh on mount
    router.refresh();

    // Refresh when page becomes visible or gains focus
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

  return null;
}

