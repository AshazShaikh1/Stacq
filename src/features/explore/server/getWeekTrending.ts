import { SupabaseExploreRepository } from "../infrastructure/supabase-repository";
import { TrendingItem } from "../types";

export async function getWeekTrending(): Promise<TrendingItem[]> {
  const repository = new SupabaseExploreRepository();
  return repository.getWeekTrending();
}
