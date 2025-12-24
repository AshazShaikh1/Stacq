"use client";

import { useState } from "react";
import { FeedGrid, FeedGridItem } from "@/components/feed/FeedGrid";
import { EmptyCollectionsState, EmptyCardsState, EmptySavedCollectionsState } from "@/components/ui/EmptyState";
import { CreateCollectionModal } from "@/components/collection/CreateCollectionModal";
import { AddCardModal } from "@/components/card/AddCardModal"; // This seems to be the one used in EmptyCardsWithAdd

interface ProfileFeedClientProps {
  items: FeedGridItem[];
  tab: string;
  isOwnProfile: boolean;
  userId: string; // The profile owner's ID
}

export function ProfileFeedClient({ items, tab, isOwnProfile, userId }: ProfileFeedClientProps) {
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Determine which empty state to show
  let emptyState;

  if (tab === "collection" || tab === "created") {
     // Collections Tab
     if (items.length === 0) {
        if (isOwnProfile) {
            emptyState = (
                <EmptyCollectionsState onCreateStack={() => setIsCollectionModalOpen(true)} />
            );
        } else {
             // For visitor, EmptyCollectionsState default text is "No collections yet... Start by creating...".
             // We might want a read-only version. 
             // Currently EmptyCollectionsState delegates to EmptyStacksState which has a button.
             // We can pass a custom EmptyState or reliance on the prop-change in EmptyState (no onClick = no button).
             // But EmptyStacksState passes `onCreateStack`.
             // If we don't pass it, it shouldn't show button.
             emptyState = <EmptyCollectionsState />;
        }
     }
  } else if (tab === "card" || tab === "cards") {
      // Cards Tab
      if (items.length === 0) {
          if (isOwnProfile) {
              emptyState = (
                  <EmptyCardsState onAddCard={() => setIsCardModalOpen(true)} />
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
        <>
          <CreateCollectionModal
            isOpen={isCollectionModalOpen}
            onClose={() => setIsCollectionModalOpen(false)}
          />
          {/* AddCardModal usually needs collectionId if adding TO a collection. 
              If global add, it might need different handling or allow picking collection.
              Let's assume AddCardModal handles global add if no ID passed (common pattern).
          */}
          <AddCardModal 
            isOpen={isCardModalOpen}
            onClose={() => setIsCardModalOpen(false)}
            // No collectionId passed implies "pick one" or "create new"
          />
        </>
      )}
    </>
  );
}


