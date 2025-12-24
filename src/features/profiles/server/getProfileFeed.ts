import { SupabaseProfilesRepository } from "../infrastructure/supabase-repository";
import { FeedItem } from "../types";

export async function getProfileFeed(userId: string, tab: string, isOwnProfile: boolean): Promise<FeedItem[]> {
  const repository = new SupabaseProfilesRepository();
  return repository.getFeed(userId, tab, isOwnProfile);
}
