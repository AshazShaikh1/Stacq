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
    const pillar = searchParams.get("pillar"); // 'build', 'play', 'grow' or null/undefined

    // Generate cache key
    const cacheKey = getCacheKey("feed", {
      version: "v2_unified_pillars",
      limit,
      offset,
      type: type || "both",
      pillar: pillar || "all",
    });

    // Use Redis cache with short TTL
    const cachedResult = await cached(
      cacheKey,
      async () => {
        // Query the Unified View (now supports 'pillar')
        let query = supabase
          .from("sorted_feed")
          .select('*')
          .order("gravity_score", { ascending: false })
          .range(offset, offset + limit - 1);

        // Filter by Type
        if (type && type !== "both") {
          const targetType = type === "stack" ? "collection" : type;
          query = query.eq("type", targetType);
        }

        // Filter by Pillar
        if (pillar && pillar !== "all") {
          query = query.eq("pillar", pillar);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        return { 
           items: data || [],
           nextOffset: (data && data.length === limit) ? offset + limit : null
        };
      },
      CACHE_TTL.FEED
    );
    
    // Supplement with User Data if needed (for View results)
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
