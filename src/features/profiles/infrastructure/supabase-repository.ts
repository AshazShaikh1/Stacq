import { createClient } from "@/lib/supabase/server";
import { ProfilesRepository } from "../repository";
import { ProfileUser, ProfileStats, FeedItem } from "../types";

export class SupabaseProfilesRepository implements ProfilesRepository {
  async findByUsername(username: string): Promise<ProfileUser | null> {
    const supabase = await createClient();
    const { data: profileUser, error } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url, role")
      .eq("username", username)
      .single();

    if (error || !profileUser) return null;
    return profileUser;
  }

  async getStats(userId: string): Promise<ProfileStats> {
    const supabase = await createClient();
    
    // Parallel fetch for stats
    const [created, saved, upvotes, views, followers, following] =
    await Promise.all([
      supabase
        .from("collections")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId),
      supabase
        .from("saves")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("votes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("collections")
        .select("stats")
        .eq("owner_id", userId),
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", userId),
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", userId),
    ]);

    const totalViews =
        views.data?.reduce((sum: any, c: any) => sum + (c.stats?.views || 0), 0) || 0;

    return {
      collections_created: created.count || 0,
      collections_saved: saved.count || 0,
      total_upvotes: upvotes.count || 0,
      total_views: totalViews,
      followers: followers.count || 0,
      following: following.count || 0,
    };
  }

  async getFeed(userId: string, tab: string, isOwnProfile: boolean): Promise<FeedItem[]> {
    const supabase = await createClient();
    let feedItems: any[] = [];

    if (tab === "card" || tab === "cards") {
        let query = supabase
          .from("cards")
          .select(
            `
          id, title, description, thumbnail_url, canonical_url, domain, created_at, created_by, is_public,
          upvotes_count, saves_count, creator:users!cards_created_by_fkey(username, display_name, avatar_url)
        `
          )
          .eq("created_by", userId)
          .eq("status", "active");
    
        if (!isOwnProfile) query = query.eq("is_public", true);
    
        const { data } = await query
          .order("created_at", { ascending: false })
          .limit(40);
        feedItems = (data || []).map((c) => ({ type: "card" as const, ...c }));
      } else if (tab === "saved") {
        const { data: saves } = await supabase
          .from("saves")
          .select("collection_id, stack_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);
    
        const ids =
          saves?.map((s) => s.collection_id || s.stack_id).filter(Boolean) || [];
    
        if (ids.length > 0) {
          let query = supabase
            .from("collections")
            .select(
              `
            id, title, description, cover_image_url, owner_id, stats,
            owner:users!collections_owner_id_fkey(username, display_name, avatar_url)
          `
            )
            .in("id", ids);
    
          if (!isOwnProfile)
            query = query.eq("is_public", true).eq("is_hidden", false);
    
          const { data } = await query;
          feedItems = (data || []).map((c) => ({
            type: "collection" as const,
            ...c,
            thumbnail_url: c.cover_image_url,
            creator: c.owner,
            domain: "Collection",
            canonical_url: `/collection/${c.id}`,
            upvotes_count: c.stats?.upvotes || 0,
            saves_count: c.stats?.saves || 0,
          }));
        }
      } else {
        // Default: Collections Created
        let query = supabase
          .from("collections")
          .select(
            `
          id, title, description, cover_image_url, owner_id, stats,
          owner:users!collections_owner_id_fkey(username, display_name, avatar_url)
        `
          )
          .eq("owner_id", userId);
    
        if (!isOwnProfile)
          query = query.eq("is_public", true).eq("is_hidden", false);
    
        const { data } = await query
          .order("created_at", { ascending: false })
          .limit(40);
    
        feedItems = (data || []).map((c) => ({
          type: "collection" as const,
          ...c,
          thumbnail_url: c.cover_image_url,
          creator: c.owner,
          domain: "Collection",
          canonical_url: `/collection/${c.id}`,
          upvotes_count: c.stats?.upvotes || 0,
          saves_count: c.stats?.saves || 0,
        }));
      }
      return feedItems;
  }
}
