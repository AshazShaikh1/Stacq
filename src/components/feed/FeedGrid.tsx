"use client";

import { FeedItem } from "./FeedItem";
import { CollectionGridSkeleton } from "@/components/ui/Skeleton";
import { EmptyStacksState } from "@/components/ui/EmptyState";

export interface FeedGridItem {
  type: "card" | "collection";
  id: string;
  [key: string]: any;
}

interface FeedGridProps {
  items?: FeedGridItem[];
  collections?: any[]; // legacy
  isLoading?: boolean;
  onCreateCollection?: () => void;
  hideHoverButtons?: boolean;
}

export function FeedGrid({
  items,
  collections,
  isLoading,
  onCreateCollection,
  hideHoverButtons = false,
  emptyState,
}: FeedGridProps & { emptyState?: React.ReactNode }) {
  /* 1. Loading */
  if (isLoading) {
    return <CollectionGridSkeleton count={8} />;
  }

  /* 2. Normalize data (WITHOUT lying about types) */
  const feedItems: FeedGridItem[] =
    items ??
    (collections
      ? collections.map((c) => ({
          ...c,
          type: "collection" as const,
        }))
      : []);

  /* 3. Empty state */
  if (feedItems.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return <EmptyStacksState onCreateStack={onCreateCollection} />;
  }

  /* 4. Responsive Grid (from v2, safe) */
  return (
    <div
      className="
        columns-1
        sm:columns-2
        lg:columns-3
        xl:columns-4
        gap-4
        md:gap-6
        space-y-4
        md:space-y-6
        pb-24
        md:pb-8
      "
    >
      {feedItems.map((item) => (
        <div key={`${item.type}-${item.id}`} className="break-inside-avoid mb-4 md:mb-6">
          <FeedItem
            item={item}
            hideHoverButtons={hideHoverButtons}
          />
        </div>
      ))}
    </div>
  );
}
