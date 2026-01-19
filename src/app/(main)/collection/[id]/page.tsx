import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ViewTracker } from "@/components/common/ViewTracker";
import { CollectionHeader } from "@/components/collection/CollectionHeader";
import { ClientAddSectionButton } from "@/components/collection/ClientAddSectionButton";
import { CollectionContent } from "@/components/collection/CollectionContent";
import { SectionActionsMenu } from "@/components/collection/SectionActionsMenu";
import { FeedGrid } from "@/components/feed/FeedGrid";
import { AddCardButton } from "@/components/card/AddCardButton";
import { EmptyCardsWithAdd } from "@/components/card/EmptyCardsWithAdd";
import { EmptyCardsState } from "@/components/ui/EmptyState";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { Suspense, lazy } from "react";
import { CommentSkeleton } from "@/components/ui/Skeleton";

import { getCollectionById } from "@/features/collections/server/getCollectionById";
import { getCollectionCards } from "@/features/collections/server/getCollectionCards";
import { getCollectionSections } from "@/features/collections/server/getCollectionSections";
import { getRelatedCollections } from "@/features/collections/server/getRelatedCollections";
import { Accordion } from "@/components/ui/Accordion";

const CommentsSection = lazy(() =>
  import("@/components/comments/CommentsSection").then((m) => ({
    default: m.CommentsSection,
  }))
);

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const query = supabase
    .from("collections")
    .select("title, description, cover_image_url, is_public, is_hidden");

  const { data: collection } = await (isUUID
    ? query.eq("id", id)
    : query.eq("slug", id)
  ).maybeSingle();

  if (!collection || (!collection.is_public && collection.is_hidden)) {
    return generateSEOMetadata({
      title: "Not Found",
      description: "Collection not found",
    });
  }

  return generateSEOMetadata({
    title: collection.title,
    description: collection.description || `View ${collection.title}`,
    image: collection.cover_image_url || undefined,
    url: `/collection/${id}`,
    type: "article",
  });
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  try {
    const { id } = await params;
    if (!id) notFound();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch Collection
    const collection = await getCollectionById(id);

    if (!collection) {
      notFound();
    }

    const isOwner = collection.owner_id === user?.id;
    const canView =
      collection.is_public || isOwner || (collection.is_hidden && isOwner);

    if (!canView) {
      notFound();
    }

    // Fetch Cards
    const cards = await getCollectionCards(collection.id);

    const owner = Array.isArray(collection.owner)
      ? collection.owner[0]
      : collection.owner;
    const tags = collection.tags?.map((t: any) => t.tag).filter(Boolean) || [];

    const stats = collection.stats || {
      cards_count: cards.length,
      views: 0,
      upvotes: 0,
      saves: 0,
      comments: 0,
    };

    // Fetch Sections
    const sections = await getCollectionSections(collection.id);
    // Fetch Related Collections
    const relatedCollections = await getRelatedCollections(collection.id);

    // Group cards by section
    const cardsBySection: Record<string, any[]> = {};
    const uncategorizedCards: any[] = [];

    cards.forEach((card) => {
      if (card.sectionId) {
        if (!cardsBySection[card.sectionId]) {
          cardsBySection[card.sectionId] = [];
        }
        cardsBySection[card.sectionId].push(card);
      } else {
        uncategorizedCards.push(card);
      }
    });

    const hasSections = sections.length > 0;

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
              relatedCollections: relatedCollections.map(c => ({
                id: c.id,
                title: c.title,
                cover_image_url: c.cover_image_url || undefined,
                owner: Array.isArray(c.owner) ? c.owner[0] : c.owner || { display_name: "Unknown" }
              })),
            }}
            isOwner={isOwner}
          />

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
                isOwner={isOwner || false} // Ensure boolean
                relatedCollections={relatedCollections}
             />
          ) : (
            <div>
              {isOwner ? (
                <EmptyCardsWithAdd collectionId={collection.id} />
              ) : (
                <EmptyCardsState />
              )}
               {/* Related Collections (Only if no cards, otherwise handled in CollectionContent) */}
               {relatedCollections.length > 0 && (
                <div className="mt-16 border-t border-gray-100 pt-12">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Related Collections</h2>
                    <FeedGrid collections={relatedCollections} />
                </div>
               )}
            </div>
          )}

          <Suspense
            fallback={
              <div className="py-8">
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <CommentSkeleton key={i} />
                  ))}
                </div>
              </div>
            }
          >
            <CommentsSection
              targetType="collection"
              targetId={collection.id}
              collectionOwnerId={collection.owner_id}
            />
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
