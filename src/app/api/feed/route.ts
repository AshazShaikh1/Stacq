import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { cachedJsonResponse } from "@/lib/cache/headers";
import { cached } from "@/lib/redis";
import { getCacheKey, CACHE_TTL } from "@/lib/cache/supabase-cache";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const type = searchParams.get("type"); // 'card' or 'collection' or 'both'

    // Generate cache key
    const cacheKey = getCacheKey("feed", {
      version: "v2_unified",
      limit,
      offset,
      type: type || "both",
    });

    // Use Redis cache with short TTL (e.g. 1 minute)
    const cachedResult = await cached(
      cacheKey,
      async () => {
        // Query the Unified View
        let query = supabase
          .from("sorted_feed")
          .select('*')
          .order("gravity_score", { ascending: false })
          .range(offset, offset + limit - 1);

        if (type && type !== "both") {
          // Normalize type (legacy 'stack' -> 'collection')
          const targetType = type === "stack" ? "collection" : type;
          query = query.eq("type", targetType);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Relation "sorted_feed_owner_id_fkey_loose" might not exist on a View unless explicitly defined or if Supabase infers it from underlying tables?
        // Views don't have FKs.
        // We might need to manually join 'users' in the View (which we avoided to keep it flexible) OR fetch users separately.
        // Actually, Supabase PostgREST on Views *can* detect relationships if we define them, OR we can just embed the user data IN the view JSON.
        // But embedding user data in the view adds overhead.
        
        // Alternative: Fetch 'sorted_feed' then fetch users.
        // OR: Adjust the View to return 'owner' as JSON.
        // Given complexity of Supabase View Relations, let's fetch IDs then users if relation fails?
        // But wait! The View has 'owner_id'. We can try standard left-join syntax if PostgREST supports it on views (it usually needs a comment-based hint or implicit relation).
        
        // Let's assume for now we might need to manually fetch users efficiently or use a JOIN in the view.
        // Re-reading Plan: The View plan returned `owner_id`.
        // To make it fast and simple, let's update the View to just include `owner_json`? 
        // No, that makes the view slow.
        
        // Better: Fetch Feed -> Get Owner IDs -> Fetch Users -> Map.
        
        return { 
           items: data || [],
           nextOffset: (data && data.length === limit) ? offset + limit : null
        };
      },
      CACHE_TTL.FEED
    );
    
    // Supplement with User Data if View didn't return joined object (likely)
    if (cachedResult?.items?.length > 0 && !cachedResult.items[0].owner) {
       const userIds = [...new Set(cachedResult.items.map((i: any) => i.owner_id))];
       const { data: users } = await supabase
         .from('users')
         .select('id, username, display_name, avatar_url')
         .in('id', userIds);
         
       const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);
       cachedResult.items = cachedResult.items.map((i: any) => ({
         ...i,
         owner: userMap.get(i.owner_id) || { username: 'unknown', display_name: 'Unknown' }
       }));
    }

    return cachedJsonResponse(cachedResult, "PUBLIC_READ");
  } catch (error: any) {
    console.error("Error in unified feed route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
