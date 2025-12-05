import { SupabaseClient } from '@supabase/supabase-js';
import { cached } from '@/lib/redis';

/**
 * Cached Supabase query wrapper
 * Automatically caches query results with a configurable TTL
 */
export async function cachedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  ttl: number = 60
): Promise<{ data: T | null; error: any }> {
  return cached(
    queryKey,
    async () => {
      const result = await queryFn();
      return result;
    },
    ttl
  );
}

/**
 * Helper to generate cache keys for Supabase queries
 */
export function getCacheKey(
  table: string,
  filters: Record<string, any> = {},
  options: { select?: string; order?: string; limit?: number } = {}
): string {
  const filterStr = Object.entries(filters)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
    .join('|');
  
  const optionsStr = [
    options.select ? `select:${options.select}` : '',
    options.order ? `order:${options.order}` : '',
    options.limit ? `limit:${options.limit}` : '',
  ]
    .filter(Boolean)
    .join('|');
  
  return `supabase:${table}:${filterStr}${optionsStr ? `:${optionsStr}` : ''}`;
}

/**
 * Cache TTL presets
 */
export const CACHE_TTL = {
  // Public, read-heavy data
  FEED: 60, // 1 minute
  EXPLORE: 120, // 2 minutes
  COLLECTIONS: 120, // 2 minutes
  CARDS: 120, // 2 minutes
  SEARCH: 300, // 5 minutes (search results change less frequently)
  
  // User-specific data (shorter TTL)
  USER_PROFILE: 30, // 30 seconds
  USER_SAVES: 30, // 30 seconds
  
  // Static/semi-static data
  METADATA: 3600, // 1 hour
  RANKING: 60, // 1 minute (ranking updates frequently)
} as const;

