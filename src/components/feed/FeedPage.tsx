'use client';

import { useState } from 'react';
import { FeedGrid } from '@/components/feed/FeedGrid';
import { CollectionGridSkeleton } from '@/components/ui/Skeleton';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr/fetcher';

export function FeedPage() {
  const [filter, setFilter] = useState<'both' | 'card' | 'collection'>('both');
  
  // Use SWR for client-side caching with automatic revalidation
  const { data, error, isLoading } = useSWR(
    `/api/feed?type=${filter}&limit=50`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      refreshInterval: 0,
    }
  );

  const feedItems = data?.feed || [];

  return (
    <div className="container mx-auto px-page py-section">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-h1 font-bold text-jet-dark mb-2">Your Feed</h1>
            <p className="text-body text-gray-muted">
              Discover curated resources from the community
            </p>
          </div>

          {/* Filter Toggle */}
          <div className="flex gap-2 bg-gray-light rounded-lg p-1">
            <button
              onClick={() => setFilter('both')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'both'
                  ? 'bg-white text-jet-dark shadow-sm'
                  : 'text-gray-muted hover:text-jet-dark'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('card')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'card'
                  ? 'bg-white text-jet-dark shadow-sm'
                  : 'text-gray-muted hover:text-jet-dark'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setFilter('collection')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'collection'
                  ? 'bg-white text-jet-dark shadow-sm'
                  : 'text-gray-muted hover:text-jet-dark'
              }`}
            >
              Collections
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <CollectionGridSkeleton count={12} />
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          Error loading feed. Please try again.
        </div>
      ) : (
        <FeedGrid items={feedItems} />
      )}
    </div>
  );
}

