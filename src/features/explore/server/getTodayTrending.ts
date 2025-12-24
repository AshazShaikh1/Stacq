import { SupabaseExploreRepository } from "../infrastructure/supabase-repository";
import { TrendingItem } from "../types";

export async function getTodayTrending(): Promise<TrendingItem[]> {
  const repository = new SupabaseExploreRepository();
  return repository.getTodayTrending();
}
