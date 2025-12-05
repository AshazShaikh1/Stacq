'use client';

import { FeedItem } from './FeedItem';
import { CollectionGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyStacksState } from '@/components/ui/EmptyState';

interface FeedItem {
  type: 'card' | 'collection';
  id: string;
  [key: string]: any;
}

interface FeedGridProps {
  items?: FeedItem[];
  collections?: any[]; // Legacy support (stacks)
  isLoading?: boolean;
  onCreateCollection?: () => void;
}

export function FeedGrid({ items, collections, isLoading, onCreateCollection }: FeedGridProps) {
  if (isLoading) {
    return <CollectionGridSkeleton count={12} />;
  }

  // Support both new items format and legacy collections format
  const feedItems = items || (collections ? collections.map(c => ({ type: 'collection' as const, ...c })) : []);

  if (feedItems.length === 0) {
    return <EmptyStacksState onCreateStack={onCreateCollection} />;
  }

  // Use masonry-style layout for cards (columns layout)
  // This allows cards with different heights to flow naturally
  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      style={{
        gridAutoRows: 'auto', // Allow rows to auto-size based on content
        gridTemplateRows: 'auto', // Use auto-sizing for rows
      }}
    >
      {feedItems.map((item) => (
        <FeedItem key={`${item.type}-${item.id}`} item={item} />
      ))}
    </div>
  );
}

