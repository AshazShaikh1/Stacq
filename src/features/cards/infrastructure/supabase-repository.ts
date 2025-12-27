import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/api-service";
import { CardRepository } from "../repository";
import { CardDetail, RelatedCard } from "../types";

export class SupabaseCardRepository implements CardRepository {
  async findById(id: string): Promise<CardDetail | null> {
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    
    // Get current user for permission check
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch card with service client (bypass RLS)
    const { data: card, error } = await serviceClient
      .from("cards")
      .select(
        `
        *,
        creator:users!cards_created_by_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq("id", id)
      .maybeSingle();

    if (error) {
       console.error(`[findById] Error fetching card: ${error.message}`);
       return null;
    }
    
    if (!card) {
       return null;
    }

    // Access Control Logic
    // 1. If public, anyone can see
    if (card.is_public) {
      return card as CardDetail;
    }

    // 2. If private, only owner can see
    if (user && card.created_by === user.id) {
      return card as CardDetail;
    }
    
    return null;
  }

  async findRelated(card: CardDetail): Promise<RelatedCard[]> {
    // FIX: Use service client to avoid "cookies" usage inside unstable_cache
    const serviceClient = createServiceClient();

    const { data: relatedCards } = await serviceClient
      .from("cards")
      .select(
        `
        id, title, description, thumbnail_url, canonical_url, domain,
        upvotes_count, saves_count, created_by,
        creator:users!cards_created_by_fkey(username, display_name, avatar_url)
      `
      )
      .eq("status", "active")
      .neq("id", card.id)
      .or(`domain.eq.${card.domain},created_by.eq.${card.created_by}`)
      .limit(4);

    return (relatedCards || []).map((card: any) => ({
      ...card,
      creator: Array.isArray(card.creator) ? card.creator[0] : card.creator,
    })) as RelatedCard[];
  }
}
