"use client";

import { useState } from "react";
import { FeedGrid, FeedGridItem } from "@/components/feed/FeedGrid";
import { EmptyCollectionsState, EmptyCardsState, EmptySavedCollectionsState } from "@/components/ui/EmptyState";
import { GlobalCreateModal } from "@/components/create/GlobalCreateModal";

interface ProfileFeedClientProps {
  items: FeedGridItem[];
  tab: string;
  isOwnProfile: boolean;
  userId: string; // The profile owner's ID
}

export function ProfileFeedClient({ items, tab, isOwnProfile, userId }: ProfileFeedClientProps) {
  const [createContext, setCreateContext] = useState<{ type: 'card' | 'collection' } | null>(null);

  // Determine which empty state to show
  let emptyState;

  if (tab === "collection" || tab === "created") {
     // Collections Tab
     if (items.length === 0) {
        if (isOwnProfile) {
            emptyState = (
                <EmptyCollectionsState onCreateStack={() => setCreateContext({ type: 'collection' })} />
            );
        } else {
             emptyState = <EmptyCollectionsState />;
        }
     }
  } else if (tab === "card" || tab === "cards") {
      // Cards Tab
      if (items.length === 0) {
          if (isOwnProfile) {
              emptyState = (
                  <EmptyCardsState onAddCard={() => setCreateContext({ type: 'card' })} />
              );
          } else {
              emptyState = <EmptyCardsState />;
          }
      }
  } else if (tab === "saved") {
      // Saved Tab
      if (items.length === 0) {
          // Saved state usually just says "No saved collections" and link to explore
          // We can use the existing component
          emptyState = <EmptySavedCollectionsState />;
      }
  }

  return (
    <>
      <FeedGrid items={items} emptyState={emptyState} />

      {isOwnProfile && (
        <GlobalCreateModal
          isOpen={!!createContext}
          onClose={() => setCreateContext(null)}
          initialContext={createContext || undefined}
        />
      )}
    </>
  );
}


