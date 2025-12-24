import { NextRequest, NextResponse } from 'next/server';
import { cachedJsonResponse } from '@/lib/cache/headers';
import { search } from "@/features/search/server/search";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const typeParam = searchParams.get('type') || 'all'; // all, collections, cards, users (support legacy 'stacks')
    const type = typeParam === 'stacks' ? 'collections' : typeParam;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Call server function
    const results = await search(
      q, 
      type as "all" | "collections" | "cards" | "users", 
      limit, 
      offset
    );

    // Cache search results (longer TTL since search queries change less frequently)
    return cachedJsonResponse(results, 'SEARCH');
  } catch (error) {
    console.error('Error in search route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

