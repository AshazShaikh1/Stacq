import { ProfileUser, ProfileStats, FeedItem } from "./types";

export interface ProfilesRepository {
  findByUsername(username: string): Promise<ProfileUser | null>;
  getStats(userId: string): Promise<ProfileStats>;
  getFeed(userId: string, tab: string, isOwnProfile: boolean): Promise<FeedItem[]>;
}
