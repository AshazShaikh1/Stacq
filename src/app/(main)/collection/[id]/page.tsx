import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import type { Metadata } from "next";

import { getCollectionById } from "@/features/collections/server/getCollectionById";
import { getCollectionCards } from "@/features/collections/server/getCollectionCards";
import { getCollectionSections } from "@/features/collections/server/getCollectionSections";
import { getRelatedCollections } from "@/features/collections/server/getRelatedCollections";
import { CollectionView } from "@/components/collection/CollectionView";

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

    return (
      <CollectionView
        collection={collection}
        cards={cards}
        sections={sections}
        relatedCollections={relatedCollections}
        isOwner={isOwner}
        owner={owner}
        tags={tags}
        stats={stats}
      />
    );
  } catch (error) {
    notFound();
  }
}
