'use client';

import { useEffect, useState } from 'react';
import { FeedGrid } from '@/components/feed/FeedGrid';
import { CollectionGridSkeleton } from '@/components/ui/Skeleton';

export function FeedPage() {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'both' | 'card' | 'collection'>('both');

  useEffect(() => {
    fetchFeed();
  }, [filter]);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      // Use cache: 'force-cache' for initial load, then 'no-store' for subsequent fetches
      const cacheOption = feedItems.length === 0 ? 'force-cache' : 'no-store';
      const response = await fetch(`/api/feed?type=${filter}&limit=50`, {
        cache: cacheOption,
        next: { revalidate: 60 }, // Revalidate every 60 seconds
      });
      const data = await response.json();
      
      if (response.ok) {
        setFeedItems(data.feed || []);
      } else {
        console.error('Error fetching feed:', data.error);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      ) : (
        <FeedGrid items={feedItems} />
      )}
    </div>
  );
}

