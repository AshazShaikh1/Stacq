import { SupabaseProfilesRepository } from "../infrastructure/supabase-repository";
import { ProfileStats } from "../types";

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const repository = new SupabaseProfilesRepository();
  return repository.getStats(userId);
}
