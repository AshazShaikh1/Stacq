import { SupabaseExploreRepository } from "../infrastructure/supabase-repository";
import { TrendingStacqer } from "../types";

export async function getTrendingStacqers(): Promise<TrendingStacqer[]> {
  const repository = new SupabaseExploreRepository();
  return repository.getTrendingStacqers();
}
