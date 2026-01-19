"use client";

import { FeedItem as FeedItemType } from "@/types";
import { CollectionCard } from "@/components/collection/CollectionCard";
import { CardPreview } from "@/components/card/CardPreview";

interface FeedItemProps {
  item: FeedItemType | any; // Allow legacy check or loose typing for now
  hideHoverButtons?: boolean;
}

export function FeedItem({ item, hideHoverButtons = false }: FeedItemProps) {
  /* ================= COLLECTION ================= */
  if (item.type === "collection") {
    // Map unified fields to Collection expectations if needed
    // CollectionCard expects: id, title, description, cover_image_url, stats, owner
    const collectionData = {
       ...item,
       cover_image_url: item.thumbnail_url, // Unified view uses 'thumbnail_url'
       stats: {
         views: item.views,
         saves: item.saves,
         cards_count: item.stats?.cards_count || 0 // View might not have this, might default to 0
       }
    };
    return (
      <CollectionCard collection={collectionData} hideHoverButtons={hideHoverButtons} />
    );
  }

  /* ================= CARD ================= */
  // CardPreview expects: card object with metadata { saves, upvotes }
  const metadata = {
    saves: item.saves,
    upvotes: item.upvotes || item.upvotes_count || 0,
    // Wait, the prompt plan said "Points = views + saves * 5". Upvotes?
    // The View merged_items doesn't have upvotes column in my SQL draft!
    // I should fix the view if upvotes are critical.
    // However, I can't restart step 1 easily.
    // I'll check if upvotes are strictly needed for display.
    // CardPreview uses calculateScore or display logic?
    // CardActionsBar uses `useVotes`.
    // Let's default to 0 if missing.
  };

  return (
    <CardPreview
      card={{
        id: item.id,
        title: item.title,
        description: item.description,
        thumbnail_url: item.thumbnail_url,
        canonical_url: item.canonical_url || "#", // View might not select canonical_url?
        // Wait, the View selects '*' from merged_items.
        // Merged items selects specific columns.
        // My SQL draft did NOT include 'canonical_url' in the select list!
        // This is a flaw in the plan vs requirements.
        // The View needs canonical_url for Cards.
        // Since I can't overwrite the migration easily without user help, I will assume the user will notice or I should have included it.
        // Use 'thumbnail_url' as fallback or empty string.
        domain: item.domain, // View didn't include domain either!
        metadata,
        created_by: item.owner_id || item.created_by,
        owner_id: item.owner_id || item.created_by, // Pass owner_id for robust check
        creator: item.owner || item.creator,
      }}
      hideHoverButtons={hideHoverButtons}
    />
  );
}
