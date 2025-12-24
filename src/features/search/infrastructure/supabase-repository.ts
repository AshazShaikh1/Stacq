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
    const supabase = await createClient(); // Use request context implicitly or modify to accept it if needed. 
    // Actually, createClient() without request is for Server Components/Actions. 
    // Since this will be called from API route, we might want to pass supabase client OR use createClient from libs.
    // However, for standardizing, we usually use createClient from @/lib/supabase/server for server actions/functions.
    // IMPORTANT: API Routes use createClient(request) for auth. Server Components use createClient().
    // If I use createClient() here (Server Action style), it might not share the request context of the API route.
    // BUT the prompt goal is to refactor API routes to delegate to server functions. 
    // Server functions usually use `createClient` from `lib/supabase/server` (cookies).
    // Let's assume this is a Server Function context.
    
    // Wait, the API route passes `request`. The repository implementation using `lib/supabase/server` accesses cookies() which is available in API routes too.
    
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

    // 1. Collections
    if (type === 'all' || type === 'collections') {
      const { data: collections, error } = await supabase
        .from('collections')
        .select(`
          id, title, description, cover_image_url, owner_id, stats, slug,
          owner:users!collections_owner_id_fkey (
            username, display_name, avatar_url
          )
        `)
        .eq('is_public', true)
        .eq('is_hidden', false)
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error && collections) {
        results.collections = collections as any;
      }
    }

    // 2. Cards
    if (type === 'all' || type === 'cards') {
      const { data: cards, error } = await supabase
        .from('cards')
        .select(`
          id, title, description, thumbnail_url, canonical_url, domain
        `)
        .eq('status', 'active')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!error && cards) {
        results.cards = cards as any;
      }
    }

    // 3. Users
    if (type === 'all' || type === 'users') {
      // Try RPC first
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
        const { data: fallbackUsers, error: fallbackError } = await supabase
          .from('users')
          .select(`id, username, display_name, avatar_url`)
          .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (!fallbackError && fallbackUsers) {
          results.users = fallbackUsers as any;
        }
      }
    }

    results.total = 
      (results.collections?.length || 0) + 
      (results.cards?.length || 0) + 
      (results.users?.length || 0);

    return results;
  }
}
