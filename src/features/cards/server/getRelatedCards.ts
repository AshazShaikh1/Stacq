import { CardDetail, RelatedCard } from "../types";
import { unstable_cache } from "next/cache";
import { SupabaseCardRepository } from "../infrastructure/supabase-repository";

export async function getRelatedCards(card: CardDetail): Promise<RelatedCard[]> {
  return unstable_cache(
    async () => {
      const repository = new SupabaseCardRepository();
      return repository.findRelated(card);
    },
    [`related-cards-${card.id}`],
    {
      revalidate: 3600, // 1 hour
      tags: [`card-${card.id}`],
    }
  )();
}
