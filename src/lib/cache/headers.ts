import { NextResponse } from 'next/server';

/**
 * Cache header presets for different types of endpoints
 */
export const CACHE_HEADERS = {
  // Public, read-heavy endpoints (feeds, explore, collections)
  PUBLIC_READ: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    'CDN-Cache-Control': 'public, s-maxage=60',
    'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
  },
  
  // Search results (longer cache)
  SEARCH: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    'CDN-Cache-Control': 'public, s-maxage=300',
    'Vercel-CDN-Cache-Control': 'public, s-maxage=300',
  },
  
  // User-specific data (shorter cache, no CDN)
  USER_SPECIFIC: {
    'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
  },
  
  // Write operations (no cache)
  NO_CACHE: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
} as const;

/**
 * Helper to add cache headers to NextResponse
 */
export function withCacheHeaders(
  response: NextResponse,
  headers: Record<string, string>
): NextResponse {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a cached JSON response
 */
export function cachedJsonResponse(
  data: any,
  cacheType: keyof typeof CACHE_HEADERS = 'PUBLIC_READ'
): NextResponse {
  return withCacheHeaders(
    NextResponse.json(data),
    CACHE_HEADERS[cacheType]
  );
}

