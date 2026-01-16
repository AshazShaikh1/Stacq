import { createClient } from "@/lib/supabase/server";
import { cached, CACHE_TTL } from "@/lib/redis";
import { getCacheKey } from "@/lib/cache/supabase-cache";
import { ExploreRepository } from "../repository";
import { TrendingItem, TrendingStacqer } from "../types";

export class SupabaseExploreRepository implements ExploreRepository {
  async getTodayTrending(): Promise<TrendingItem[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const result = await cached(
      getCacheKey("today-trending", { date: today.toISOString() }),
      async () => {
        const supabase = await createClient();

        // Fetch today's collections
        const { data: todayCollections } = await supabase
          .from("collections")
          .select(
            `
            id,
            title,
            description,
            cover_image_url,
            owner_id,
            stats,
            created_at,
            owner:users!collections_owner_id_fkey (
              username,
              display_name,
              avatar_url
            ),
            tags:collection_tags (
              tag:tags (
                id,
                name
              )
            )
          `
          )
          .eq("is_public", true)
          .eq("is_hidden", false)
          .gte("created_at", today.toISOString())
          .limit(50);

        // Fetch today's cards
        const { data: todayCards } = await supabase
          .from("cards")
          .select(
            `
            id,
            title,
            description,
            thumbnail_url,
            canonical_url,
            domain,
            created_at,
            upvotes_count,
            saves_count,
            created_by,
            creator:users!cards_created_by_fkey (
              username,
              display_name,
              avatar_url
            ),
            collection_cards(id)
          `
          )
          .eq("status", "active")
          .eq("is_public", true)
          .gte("created_at", today.toISOString())
          .limit(100);

        // Filter standalone cards (in-memory)
        const standaloneTodayCards = (todayCards || []).filter(c => !c.collection_cards || c.collection_cards.length === 0).slice(0, 50);

        // Fetch ranking scores for all items
        const allItemIds = [
          ...(todayCollections || []).map((c: any) => c.id),
          ...(todayCards || []).map((c: any) => c.id),
        ];

        let scoreMap = new Map<string, number>();

        if (allItemIds.length > 0) {
          const { data: scores } = await supabase
            .from("ranking_scores")
            .select("item_id, norm_score")
            .in("item_id", allItemIds);

          if (scores) {
            scores.forEach((s: any) => {
              if (s.norm_score !== null) {
                scoreMap.set(s.item_id, s.norm_score);
              }
            });
          }
        }

        // Combine and sort
        const collectionsWithScore = (todayCollections || []).map((c: any) => ({
          ...c,
          type: "collection" as const,
          trendingScore: scoreMap.get(c.id) || 0,
        }));

        const cardsWithScore = (standaloneTodayCards || []).map((c: any) => ({
          ...c,
          type: "card" as const,
          trendingScore: scoreMap.get(c.id) || 0,
          metadata: {
            upvotes: c.upvotes_count || 0,
            saves: c.saves_count || 0,
          },
        }));

        const allTrending = [...collectionsWithScore, ...cardsWithScore]
          .sort((a, b) => b.trendingScore - a.trendingScore)
          .slice(0, 5);

        return { data: allTrending };
      },
      CACHE_TTL.EXPLORE
    );

    return (result?.data || []) as TrendingItem[];
  }

  async getTrendingStacqers(): Promise<TrendingStacqer[]> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const result = await cached(
      getCacheKey("trending-stacqers", { days: 3 }),
      async () => {
        const supabase = await createClient();

        // Get upvotes on collections in last 3 days
        const { data: collectionVotes } = await supabase
          .from("votes")
          .select("target_id")
          .eq("target_type", "collection")
          .gte("created_at", threeDaysAgo.toISOString());

        // Get upvotes on cards in last 3 days
        const { data: cardVotes } = await supabase
          .from("votes")
          .select("target_id")
          .eq("target_type", "card")
          .gte("created_at", threeDaysAgo.toISOString());

        // Get followers increased in last 3 days
        const { data: recentFollows } = await supabase
          .from("follows")
          .select("following_id")
          .gte("created_at", threeDaysAgo.toISOString());

        // Get saves on collections in last 3 days
        const { data: recentSaves } = await supabase
          .from("saves")
          .select("target_id, collections!inner(owner_id)")
          .eq("target_type", "collection")
          .gte("created_at", threeDaysAgo.toISOString());

        // Calculate stats per user
        const userStats: Record<
          string,
          {
            upvotes_received: number;
            followers_increased: number;
            saves_received: number;
          }
        > = {};

        // Count upvotes on collections - fetch owners separately
        if (collectionVotes && collectionVotes.length > 0) {
          const collectionIds = collectionVotes
            .map((v: any) => v.target_id)
            .filter(Boolean);
          if (collectionIds.length > 0) {
            const { data: collections } = await supabase
              .from("collections")
              .select("id, owner_id")
              .in("id", collectionIds);

            if (collections) {
              const collectionOwnerMap: Record<string, string> = {};
              collections.forEach((c: any) => {
                collectionOwnerMap[c.id] = c.owner_id;
              });

              collectionVotes.forEach((vote: any) => {
                const userId = collectionOwnerMap[vote.target_id];
                if (userId) {
                  if (!userStats[userId]) {
                    userStats[userId] = {
                      upvotes_received: 0,
                      followers_increased: 0,
                      saves_received: 0,
                    };
                  }
                  userStats[userId].upvotes_received++;
                }
              });
            }
          }
        }

        // Count upvotes on cards - fetch creators separately
        if (cardVotes && cardVotes.length > 0) {
          const cardIds = cardVotes.map((v: any) => v.target_id).filter(Boolean);
          if (cardIds.length > 0) {
            const { data: cards } = await supabase
              .from("cards")
              .select("id, created_by")
              .in("id", cardIds);

            if (cards) {
              const cardCreatorMap: Record<string, string> = {};
              cards.forEach((c: any) => {
                if (c.created_by) {
                  cardCreatorMap[c.id] = c.created_by;
                }
              });

              cardVotes.forEach((vote: any) => {
                const userId = cardCreatorMap[vote.target_id];
                if (userId) {
                  if (!userStats[userId]) {
                    userStats[userId] = {
                      upvotes_received: 0,
                      followers_increased: 0,
                      saves_received: 0,
                    };
                  }
                  userStats[userId].upvotes_received++;
                }
              });
            }
          }
        }

        // Count followers
        if (recentFollows) {
          recentFollows.forEach((follow: any) => {
            const userId = follow.following_id;
            if (userId) {
              if (!userStats[userId]) {
                userStats[userId] = {
                  upvotes_received: 0,
                  followers_increased: 0,
                  saves_received: 0,
                };
              }
              userStats[userId].followers_increased++;
            }
          });
        }

        // Count saves - need to fetch collection owners separately
        if (recentSaves && recentSaves.length > 0) {
          const collectionIds = recentSaves
            .map((s: any) => s.target_id)
            .filter(Boolean);
          if (collectionIds.length > 0) {
            const { data: collections } = await supabase
              .from("collections")
              .select("id, owner_id")
              .in("id", collectionIds);

            if (collections) {
              const collectionOwnerMap: Record<string, string> = {};
              collections.forEach((c: any) => {
                collectionOwnerMap[c.id] = c.owner_id;
              });

              recentSaves.forEach((save: any) => {
                const userId = collectionOwnerMap[save.target_id];
                if (userId) {
                  if (!userStats[userId]) {
                    userStats[userId] = {
                      upvotes_received: 0,
                      followers_increased: 0,
                      saves_received: 0,
                    };
                  }
                  userStats[userId].saves_received++;
                }
              });
            }
          }
        }

        // Get user details for users with activity
        const userIds = Object.keys(userStats);
        if (userIds.length === 0) {
          return { data: [] };
        }

        const { data: users } = await supabase
          .from("users")
          .select("id, username, display_name, avatar_url")
          .in("id", userIds);

        // Combine user data with stats and calculate total score
        const usersWithStats = (users || [])
          .map((user: any) => {
            const stats = userStats[user.id] || {
              upvotes_received: 0,
              followers_increased: 0,
              saves_received: 0,
            };
            const totalScore =
              stats.upvotes_received * 2 +
              stats.followers_increased * 3 +
              stats.saves_received * 1.5;
            return {
              ...user,
              stats,
              totalScore,
            };
          })
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, 3);

        return { data: usersWithStats };
      },
      CACHE_TTL.EXPLORE
    );

    return (result?.data || []) as TrendingStacqer[];
  }

  async getWeekTrending(): Promise<TrendingItem[]> {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

    const result = await cached(
      getCacheKey("week-trending", {
        weekAgo: weekAgo.toISOString(),
        today: today.toISOString(),
      }),
      async () => {
        const supabase = await createClient();

        // Fetch last week's collections
        const { data: weekCollections } = await supabase
          .from("collections")
          .select(
            `
            id,
            title,
            description,
            cover_image_url,
            owner_id,
            stats,
            created_at,
            owner:users!collections_owner_id_fkey (
              username,
              display_name,
              avatar_url
            ),
            tags:collection_tags (
              tag:tags (
                id,
                name
              )
            )
          `
          )
          .eq("is_public", true)
          .eq("is_hidden", false)
          .gte("created_at", weekAgo.toISOString())
          .lt("created_at", today.toISOString())
          .order("created_at", { ascending: false })
          .limit(30);

        // Fetch last week's cards
        const { data: weekCards } = await supabase
          .from("cards")
          .select(
            `
            id,
            title,
            description,
            thumbnail_url,
            canonical_url,
            domain,
            created_at,
            upvotes_count,
            saves_count,
            created_by,
            creator:users!cards_created_by_fkey (
              username,
              display_name,
              avatar_url
            ),
            collection_cards(id)
          `
          )
          .eq("status", "active")
          .eq("is_public", true)
          .gte("created_at", weekAgo.toISOString())
          .lt("created_at", today.toISOString())
          .order("created_at", { ascending: false })
          .limit(60);

        // Filter standalone cards (in-memory)
        const standaloneWeekCards = (weekCards || []).filter(c => !c.collection_cards || c.collection_cards.length === 0).slice(0, 30);

        // Fetch ranking scores
        const allItemIds = [
          ...(weekCollections || []).map((c: any) => c.id),
          ...(weekCards || []).map((c: any) => c.id),
        ];

        let scoreMap = new Map<string, number>();

        if (allItemIds.length > 0) {
          const { data: scores } = await supabase
            .from("ranking_scores")
            .select("item_id, norm_score")
            .in("item_id", allItemIds);

          if (scores) {
            scores.forEach((s: any) => {
              if (s.norm_score !== null) {
                scoreMap.set(s.item_id, s.norm_score);
              }
            });
          }
        }

        const collectionsWithScore = (weekCollections || []).map((c: any) => ({
          ...c,
          type: "collection" as const,
          trendingScore: scoreMap.get(c.id) || 0,
        }));

        const cardsWithScore = (standaloneWeekCards || []).map((c: any) => ({
          ...c,
          type: "card" as const,
          trendingScore: scoreMap.get(c.id) || 0,
          metadata: {
            upvotes: c.upvotes_count || 0,
            saves: c.saves_count || 0,
          },
        }));

        const allWeekTrending = [...collectionsWithScore, ...cardsWithScore].sort(
          (a, b) => b.trendingScore - a.trendingScore
        );

        return { data: allWeekTrending };
      },
      CACHE_TTL.EXPLORE
    );

    return (result?.data || []) as TrendingItem[];
  }
}
