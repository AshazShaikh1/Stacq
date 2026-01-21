"use client";

import { useState } from "react";
import { CollectionHeader } from "@/components/collection/CollectionHeader";
import { CollectionContent } from "@/components/collection/CollectionContent";
import { ClientAddSectionButton } from "@/components/collection/ClientAddSectionButton";
import { AddCardButton } from "@/components/card/AddCardButton";
import { CommentsSection } from "@/components/comments/CommentsSection";
import { EmptyCardsWithAdd } from "@/components/card/EmptyCardsWithAdd";
import { EmptyCardsState } from "@/components/ui/EmptyState";
import { FeedGrid } from "@/components/feed/FeedGrid";
import { ViewTracker } from "@/components/common/ViewTracker";
import { cn } from "@/lib/utils";

interface CollectionViewProps {
  collection: any;
  cards: any[];
  sections: any[];
  relatedCollections: any[];
  isOwner: boolean;
  owner: any;
  tags: any[];
  stats: any;
}

export function CollectionView({
  collection,
  cards,
  sections,
  relatedCollections,
  isOwner,
  owner,
  tags,
  stats,
}: CollectionViewProps) {
  const [activeTab, setActiveTab] = useState<"resources" | "discussion">(
    "resources"
  );

  return (
    <div className="min-h-screen bg-white">
      <ViewTracker type="collection" id={collection.id} />
      <div className="container mx-auto px-4 md:px-page py-6 md:py-12 pb-24 md:pb-8">
        <CollectionHeader
          collection={{
            ...collection,
            description: collection.description || undefined,
            cover_image_url: collection.cover_image_url || undefined,
            owner: owner || {
              username: "unknown",
              display_name: "Unknown User",
            },
            tags,
            stats,
            relatedCollections: relatedCollections.map((c) => ({
              id: c.id,
              title: c.title,
              cover_image_url: c.cover_image_url || undefined,
              owner: Array.isArray(c.owner)
                ? c.owner[0]
                : c.owner || { display_name: "Unknown" },
            })),
          }}
          isOwner={isOwner}
        />

        {/* --- TABS SYSTEM --- */}
        <div className="flex border-b border-gray-100 mb-8 sticky top-16 md:top-20 bg-white z-30 -mx-4 px-4 md:mx-0 md:px-0">
          <button
            onClick={() => setActiveTab("resources")}
            className={cn(
              "px-6 py-3 font-semibold text-sm transition-colors relative",
              activeTab === "resources"
                ? "text-emerald-600"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            Resources
            <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
              {cards.length}
            </span>
            {activeTab === "resources" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab("discussion")}
            className={cn(
              "px-6 py-3 font-semibold text-sm transition-colors relative",
              activeTab === "discussion"
                ? "text-emerald-600"
                : "text-gray-500 hover:text-gray-800"
            )}
          >
            Discussion
             {/* Use fallback for comment count if not in stats */}
            <span className="ml-2 bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-xs">
              {stats?.comments || 0}
            </span>
            {activeTab === "discussion" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
            )}
          </button>
        </div>

        {/* --- CONTENT --- */}
        {activeTab === "resources" ? (
          <>
            {isOwner && (
              <div className="mb-6 flex justify-end gap-3">
                <ClientAddSectionButton collectionId={collection.id} />
                <AddCardButton collectionId={collection.id} />
              </div>
            )}

            {cards.length > 0 ? (
              <CollectionContent
                collectionId={collection.id}
                initialSections={sections}
                initialCards={cards}
                isOwner={isOwner || false}
                relatedCollections={relatedCollections}
              />
            ) : (
              <div>
                {isOwner ? (
                  <EmptyCardsWithAdd collectionId={collection.id} />
                ) : (
                  <EmptyCardsState />
                )}
                {relatedCollections.length > 0 && (
                  <div className="mt-16 border-t border-gray-100 pt-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">
                      Related Collections
                    </h2>
                    <FeedGrid collections={relatedCollections} />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="max-w-3xl mx-auto">
            <CommentsSection
              targetType="collection"
              targetId={collection.id}
              collectionOwnerId={collection.owner_id}
            />
          </div>
        )}
      </div>
    </div>
  );
}
