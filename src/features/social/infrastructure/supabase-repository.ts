import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/api-service";

import { SocialRepository, VoteResult, SaveResult, FollowResult, FollowStatus } from "../types";

export class SupabaseSocialRepository implements SocialRepository {
  // --- VOTES ---
  async toggleVote(userId: string, targetType: string, targetId: string): Promise<VoteResult> {
    const serviceClient = createServiceClient();
    
    // Normalize target_type
    const normalizedTargetType = targetType === "stack" ? "collection" : targetType;

    // Check if vote exists
    const { data: existingVote } = await serviceClient
      .from("votes")
      .select("id")
      .eq("user_id", userId)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .maybeSingle();

    if (existingVote) {
      // Unvote
      await serviceClient.from("votes").delete().eq("id", existingVote.id);
      await this.updateVoteStats(serviceClient, targetType, targetId, -1);

      return { voted: false };
    } else {
      // Vote
      const { error: voteError } = await serviceClient.from("votes").insert({
        user_id: userId,
        target_type: normalizedTargetType,
        target_id: targetId,
      });

      if (voteError) throw new Error(voteError.message);

      await this.updateVoteStats(serviceClient, targetType, targetId, 1);


      // Notification (Fire and forget-ish, but awaited here for safety)
      await this.sendVoteNotification(serviceClient, userId, normalizedTargetType, targetId);

      return { voted: true };
    }
  }

  // --- SAVES ---
  async toggleSave(
    userId: string,
    targetType: string,
    targetId: string,
    metadata?: { collectionId?: string; cardId?: string; stackId?: string }
  ): Promise<SaveResult> {
    const serviceClient = createServiceClient();
    
    // Check if exists
    const { data: existingSave } = await serviceClient
      .from("saves")
      .select("id")
      .eq("user_id", userId)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .maybeSingle();

    if (existingSave) {
      // Unsave
      await serviceClient.from("saves").delete().eq("id", existingSave.id);
      
      const { count: saveCount } = await serviceClient
        .from("saves")
        .select("*", { count: "exact", head: true })
        .eq("target_type", targetType)
        .eq("target_id", targetId);



      return { saved: false, saves: saveCount || 0 };
    } else {
      // Save
      const { error: saveError } = await serviceClient.from("saves").insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        collection_id: targetType === 'collection' ? (metadata?.collectionId || targetId) : null,
        card_id: targetType === 'card' ? (metadata?.cardId || targetId) : null,
        stack_id: metadata?.stackId,
      });

      if (saveError) throw new Error(saveError.message);

      const { count: saveCount } = await serviceClient
        .from("saves")
        .select("*", { count: "exact", head: true })
        .eq("target_type", targetType)
        .eq("target_id", targetId);



      return { saved: true, saves: saveCount || 0 };
    }
  }

  async getUserSaves(userId: string, limit: number, offset: number): Promise<any[]> {
    const supabase = await createClient(); // Use user context for reading
    
    const { data: saves, error } = await supabase
      .from("saves")
      .select(`
        id,
        target_type,
        target_id,
        created_at,
        collection:collections!saves_collection_id_fkey (
          id, title, description, slug, cover_image_url, is_public, stats, owner_id, created_at,
          owner:users!collections_owner_id_fkey (id, username, display_name, avatar_url)
        ),
        card:cards!saves_card_id_fkey (
          id, title, description, thumbnail_url, canonical_url, domain, metadata
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return saves?.map(save => ({
      ...save,
      item: save.target_type === 'collection' ? save.collection : save.card,
    })) || [];
  }

  // --- FOLLOWS ---
  async toggleFollow(followerId: string, followingId: string): Promise<FollowResult> {
    const serviceClient = createServiceClient();

    const { data: existingFollow } = await serviceClient
      .from("follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();

    if (existingFollow) {
      throw new Error("Already following this user"); // Route logic was check then insert. Delete is separate route.
    }

    const { data: follow, error: followError } = await serviceClient
      .from("follows")
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })
      .select()
      .single();

    if (followError) throw new Error("Failed to follow user");

    // Notification
    try {
      await serviceClient.from("notifications").insert({
        user_id: followingId,
        actor_id: followerId,
        type: "follow",
        data: {},
        read: false,
      });
    } catch (err) {
      console.error("Error creating follow notification:", err);
    }

    return { success: true, follow };
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const serviceClient = createServiceClient();
    const { error } = await serviceClient
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    
    if (error) {
       // Ignore table missing error for consistency with route
       if (error.code !== 'PGRST205') {
         throw new Error("Failed to unfollow user");
       }
    }
  }

  async getFollowStatus(currentUserId: string | null, targetUserId: string): Promise<FollowStatus> {
    const supabase = await createClient(); // Use public/user client for reads? Route used createClient(request)

    let isFollowing = false;
    if (currentUserId) {
      const { data: follow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .maybeSingle();
      isFollowing = !!follow;
    }

    const { count: followerCount } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", targetUserId);

    const { count: followingCount } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", targetUserId);

    return {
      isFollowing,
      followerCount: followerCount || 0,
      followingCount: followingCount || 0,
    };
  }

  async getFollowers(userId: string): Promise<any[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("follows")
      .select(`
        id,
        follower:users!follows_follower_id_fkey (
          id, username, display_name, avatar_url
        )
      `)
      .eq("following_id", userId);

    if (error) throw new Error(error.message);

    return data?.map((f: any) => f.follower) || [];
  }

  async getFollowing(userId: string): Promise<any[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("follows")
      .select(`
        id,
        following:users!follows_following_id_fkey (
          id, username, display_name, avatar_url
        )
      `)
      .eq("follower_id", userId);

    if (error) throw new Error(error.message);

    return data?.map((f: any) => f.following) || [];
  }

  // --- PRIVATE HELPERS ---

  private async updateVoteStats(
    serviceClient: any,
    targetType: string,
    targetId: string,
    delta: number
  ) {
    if (targetType === "stack" || targetType === "collection") {
      // Collections use 'stats' JSONB
      const { data: target } = await serviceClient
        .from("collections")
        .select("stats")
        .eq("id", targetId)
        .single();

      if (target) {
        const stats = target.stats || {};
        const currentUpvotes = (stats.upvotes || 0) + delta;

        await serviceClient
          .from("collections")
          .update({
            stats: {
              ...stats,
              upvotes: Math.max(0, currentUpvotes),
            },
          })
          .eq("id", targetId);
      }
    } else {
      // Cards use direct columns (upvotes_count)
      // This is handled by a database TRIGGER (update_card_counters) defined in migration 026/043.
      // We do NOT manual update here to avoid double counting or RLS issues.
    }
  }

  private async sendVoteNotification(
    serviceClient: any, 
    userId: string, 
    normalizedTargetType: string, 
    targetId: string
  ) {
    try {
      const table = normalizedTargetType === "collection" ? "collections" : "cards";
      const ownerField = normalizedTargetType === "collection" ? "owner_id" : "created_by";

      const { data: targetItem } = await serviceClient
        .from(table)
        .select(`id, title, ${ownerField}`)
        .eq("id", targetId)
        .single();

      if (targetItem) {
        const item = targetItem as any;
        const ownerId = item[ownerField];

        if (ownerId && ownerId !== userId) {
          await serviceClient.from("notifications").insert({
            user_id: ownerId,
            actor_id: userId,
            type: "upvote",
            data: {
              [`${normalizedTargetType}_id`]: targetId,
              [`${normalizedTargetType}_title`]: targetItem.title,
            },
            read: false,
          });
        }
      }
    } catch (err) {
      console.error("Error creating upvote notification:", err);
    }
  }


}
