import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/api-service";
import { CardRepository } from "../repository";
import { CardDetail, RelatedCard } from "../types";

export class SupabaseCardRepository implements CardRepository {
  async findById(id: string): Promise<CardDetail | null> {
    const supabase = await createClient();
    const serviceClient = createServiceClient();
    
    // Get current user for permission check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log(`[findById] Looking for card: ${id}`);
    console.log(`[findById] Current User: ${user?.id || 'null'} (Error: ${authError?.message})`);

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
       console.log(`[findById] Card not found in DB`);
       return null;
    }

    console.log(`[findById] Card found: ${card.id}, Public: ${card.is_public}, Owner: ${card.created_by}`);

    // Access Control Logic
    // 1. If public, allow
    if (card.is_public) {
      console.log(`[findById] Access granted: Public`);
      return card as CardDetail;
    }

    // 2. If owner, allow
    if (user && card.created_by === user.id) {
      console.log(`[findById] Access granted: Owner`);
      return card as CardDetail;
    }
    
    console.log(`[findById] Access denied: Private and not owner`);

    // 3. (Optional) Check if in visible collection - for now strict owner/public check
    // If we wanted to check collections, we'd need to query collection_cards
    
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
