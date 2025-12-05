'use client';

import { FeedGrid } from '@/components/feed/FeedGrid';
import { CollectionGridSkeleton } from '@/components/ui/Skeleton';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr/fetcher';

export function HomeFeed() {
  // Use SWR for client-side caching
  const { data, error, isLoading } = useSWR(
    '/api/feed?type=both&limit=50',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    }
  );

  if (isLoading) {
    return <CollectionGridSkeleton count={12} />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading feed. Please try again.
      </div>
    );
  }

  return <FeedGrid items={data?.feed || []} />;
}

