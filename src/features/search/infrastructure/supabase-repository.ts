import { createClient } from "@/lib/supabase/server";
import { SearchRepository } from "../repository";
import { SearchResults } from "../types";

export class SupabaseSearchRepository implements SearchRepository {
  async search(
    query: string,
    type: "all" | "collections" | "cards" | "users",
    limit: number,
    offset: number
  ): Promise<SearchResults> {
    const supabase = await createClient(); // Server context
    const results: SearchResults = {
      collections: [],
      cards: [],
      users: [],
      total: 0,
    };

    if (!query || query.trim().length === 0) {
      return results;
    }

    const searchQuery = query.trim();

    try {
      // 1. Unified Search for Cards and Collections
      if (type !== 'users') {
        const { data: items, error } = await supabase.rpc('search_items', {
          query_text: searchQuery,
          filter_type: type,
          limit_count: limit,
          offset_count: offset,
        });

        if (error || !items) {
          // Fallback: Direct Query for Collections if RPC fails
           if (type === 'collections' || type === 'all') {
               const { data: cols } = await supabase
                 .from('collections')
                 .select(`
                    id, title, description, slug, is_public,
                    owner:users!collections_owner_id_fkey(username, display_name, avatar_url)
                 `)
                 .eq('is_public', true)
                 .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
                 .limit(limit);

               if (cols) {
                   cols.forEach((c: any) => {
                       results.collections.push({
                           id: c.id,
                           title: c.title,
                           description: c.description,
                           slug: c.slug,
                           owner: c.owner,
                           // mock other fields if missing
                           stats: { views: 0, likes: 0 },
                           created_at: new Date().toISOString()
                       } as any);
                   });
               }
           }
        } else if (items) {
          // Map RPC results to domain types
          items.forEach((item: any) => {
            if (item.type === 'collection') {
              results.collections.push({
                id: item.id,
                title: item.title,
                description: item.description,
                cover_image_url: item.image_url,
                owner_id: item.owner_id,
                slug: item.slug,
                stats: item.stats,
                owner: {
                  username: item.owner_username,
                  display_name: item.owner_display_name,
                  avatar_url: item.owner_avatar_url,
                },
                created_at: item.created_at,
                score: item.score,
              });
            } else if (item.type === 'card') {
              results.cards.push({
                id: item.id,
                title: item.title,
                description: item.description,
                thumbnail_url: item.image_url,
                canonical_url: item.canonical_url,
                domain: item.domain,
                stats: item.stats,
                created_by: item.owner_id,
                creator: {
                  username: item.owner_username,
                  display_name: item.owner_display_name,
                  avatar_url: item.owner_avatar_url,
                },
                created_at: item.created_at,
                upvotes_count: item.stats?.upvotes || 0,
                saves_count: item.stats?.saves || 0,
                comments_count: item.stats?.comments || 0,
                score: item.score,
              });
            }
          });
        }
      }

      // 2. Search Users (Keep existing logic or use RPC if desired, keeping separate for now as request focused on cards/collections)
      if (type === 'all' || type === 'users') {
        const { data: users, error: rpcError } = await supabase
          .rpc('search_users', {
            search_term: searchQuery,
            result_limit: limit,
            result_offset: offset,
          });

        if (!rpcError && users) {
          results.users = users as any;
        } else {
          // Fallback
          const { data: fallbackUsers } = await supabase
            .from('users')
            .select(`id, username, display_name, avatar_url`)
            .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
            .limit(limit)
            .range(offset, offset + limit - 1);

          if (fallbackUsers) {
            results.users = fallbackUsers as any;
          }
        }
      }

      results.total =
        results.collections.length +
        results.cards.length +
        results.users.length;

    } catch (err) {
      console.error('Search repository error:', err);
    }

    return results;
  }
}
