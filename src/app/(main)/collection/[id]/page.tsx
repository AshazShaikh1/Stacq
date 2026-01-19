import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ViewTracker } from "@/components/common/ViewTracker";
import { CollectionHeader } from "@/components/collection/CollectionHeader";
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
            }}
            isOwner={isOwner}
          />

          {isOwner && cards.length > 0 && (
            <div className="mb-6 flex justify-end">
              <AddCardButton collectionId={collection.id} />
            </div>
          )}

          {cards.length > 0 ? (
            <FeedGrid items={cards} />
          ) : (
            <div>
              {isOwner ? (
                <EmptyCardsWithAdd collectionId={collection.id} />
              ) : (
                <EmptyCardsState />
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
