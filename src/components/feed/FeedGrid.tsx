'use client';

import { StackCard } from '@/components/stack/StackCard';
import { StackGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyStacksState } from '@/components/ui/EmptyState';

interface Stack {
  id: string;
  title: string;
  description?: string;
  cover_image_url?: string;
  owner_id: string;
  stats: {
    views: number;
    upvotes: number;
    saves: number;
    comments: number;
  };
  owner?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

interface FeedGridProps {
  stacks: Stack[];
  isLoading?: boolean;
  onCreateStack?: () => void;
}

export function FeedGrid({ stacks, isLoading, onCreateStack }: FeedGridProps) {
  if (isLoading) {
    return <StackGridSkeleton count={12} />;
  }

  if (stacks.length === 0) {
    return <EmptyStacksState onCreateStack={onCreateStack} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {stacks.map((stack) => (
        <StackCard key={stack.id} stack={stack} />
      ))}
    </div>
  );
}

