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

    // Strategy: Try fetching with 'order' column first. If it fails (column missing), fallback to 'added_at'.
    
    const runQuery = async (useOrder: boolean) => {
        let query = supabase
            .from("collection_cards")
            .select(
                `
                added_by,
                adder:users!collection_cards_added_by_fkey (
                    username, display_name, avatar_url
                ),
                note,
                section_id,
                ${useOrder ? '"order",' : ''} 
                card:cards (
                id, title, description, thumbnail_url, canonical_url, domain,
                upvotes_count, saves_count, created_by, created_at, note,
                creator:users!cards_created_by_fkey (
                    id, username, display_name, avatar_url
                )
                )
            `
            )
            .eq("collection_id", collectionId);
            
        if (useOrder) {
            query = query.order('"order"', { ascending: true });
        } else {
            query = query.order("added_at", { ascending: false });
        }
        
        return query.limit(100);
    };

    // Attempt 1: With Order
    let { data: collectionCards, error } = await runQuery(true);

    if (error) {
        console.warn("Retrying fetch without 'order' sort:", error.message);
        // Attempt 2: Fallback
        const res = await runQuery(false);
        collectionCards = res.data;
        // Suppress error in console if fallback works, but we already logged warning
        if (res.error) {
             console.error("Supabase findCards final error:", res.error);
             return [];
        }
    }

    return (collectionCards || [])
      .map((cc: any) => {
        // Fallback Logic: Context Note -> Global Note
        const finalNote = cc.note || cc.card?.note;
        
        // Attribution Logic:
        // If context note exists -> Added By (Collection Owner/Adder)
        // If global note exists fallback -> Created By (Card Creator)
        let finalAuthor = null;
        if (cc.note) {
             finalAuthor = Array.isArray(cc.adder) ? cc.adder[0] : cc.adder;
        } else if (cc.card?.note) {
             finalAuthor = Array.isArray(cc.card?.creator) ? cc.card.creator[0] : cc.card?.creator;
        }

        return {
        ...cc.card,
        addedBy: cc.added_by,
        addedByProfile: finalAuthor, // Use the resolved author for the note
        note: finalNote,
        sectionId: cc.section_id,
        order: cc.order, // Will be undefined in fallback, handling strictly? Type says optional.
        type: "card" as const,
        creator: Array.isArray(cc.card?.creator) ? cc.card.creator[0] : cc.card?.creator
      };
      })
      .filter((c: any) => c && c.id) as CollectionCard[];
  }
  async findSections(collectionId: string): Promise<any[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("sections")
      .select("*")
      .eq("collection_id", collectionId)
      .order("order", { ascending: true });
    return data || [];
  }

  async findRelatedCollections(collectionId: string): Promise<CollectionDetail[]> {
    const supabase = await createClient();
    
    // Fetch related IDs
    const { data: relations } = await supabase
      .from("collection_relations")
      .select("target_collection_id")
      .eq("source_collection_id", collectionId);
      
    if (!relations || relations.length === 0) return [];

    const ids = relations.map((r: any) => r.target_collection_id);

    // Fetch collections details
    const { data: collections } = await supabase
      .from("collections")
      .select(`
        *,
        owner:users!collections_owner_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `)
      .in("id", ids)
      .eq("is_public", true); // Only public ones for now

    if (!collections) return [];

    return collections.map((c: any) => ({
      ...c,
      title: c.title,
      description: c.description || null,
      cover_image_url: c.cover_image_url || null,
      is_public: c.is_public,
      is_hidden: c.is_hidden,
      owner_id: c.owner_id,
      slug: c.slug,
      owner: c.owner,
      tags: [],
      stats: {},
      created_at: c.created_at
    }));
  }
}
