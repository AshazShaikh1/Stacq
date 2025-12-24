import { createClient } from "@/lib/supabase/server";
import { CollectionsRepository } from "../repository";
import { CollectionDetail, CollectionCard } from "../types";

export class SupabaseCollectionsRepository implements CollectionsRepository {
  async findByIdOrSlug(idOrSlug: string): Promise<CollectionDetail | null> {
    const supabase = await createClient();
    
    // Check if UUID
    const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const collectionQuery = supabase.from("collections").select(`
        *,
        owner:users!collections_owner_id_fkey (
          username,
          display_name,
          avatar_url
        ),
        tags:collection_tags (
          tag:tags (
            id,
            name
          )
        )
      `);

    const { data: collection, error } = await (isUUID
      ? collectionQuery.eq("id", idOrSlug)
      : collectionQuery.eq("slug", idOrSlug)
    ).maybeSingle();

    if (error || !collection) {
      return null;
    }

    // Ensure owner is a single object if array returned (though relation should be one-to-one or many-to-one)
    // The query defined uses ! which usually implies inner join, but let's match existing logic
    const mappedCollection = {
        ...collection,
        owner: Array.isArray(collection.owner) ? collection.owner[0] : collection.owner
    };

    return mappedCollection as CollectionDetail;
  }

  async findCards(collectionId: string): Promise<CollectionCard[]> {
    const supabase = await createClient();

    const { data: collectionCards } = await supabase
      .from("collection_cards")
      .select(
        `
        added_by,
        card:cards (
          id, title, description, thumbnail_url, canonical_url, domain,
          upvotes_count, saves_count, created_by, created_at,
          creator:users!cards_created_by_fkey (
            id, username, display_name, avatar_url
          )
        )
      `
      )
      .eq("collection_id", collectionId)
      .order("added_at", { ascending: false })
      .limit(100);

    return (collectionCards || [])
      .map((cc: any) => ({
        ...cc.card,
        addedBy: cc.added_by,
        type: "card" as const,
        creator: Array.isArray(cc.card?.creator) ? cc.card.creator[0] : cc.card?.creator
      }))
      .filter((c: any) => c && c.id) as CollectionCard[];
  }
}
