import { redis } from "@/lib/redis";

export const CACHE_TTL = 60;

export function getCacheKey(key: string, params: Record<string, any> = {}): string {
  const paramString = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");
  
  return `supabase:${key}:${paramString}`;
}

export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 60
): Promise<T> {
  const start = Date.now();

  try {
    // 1. Try to get from Redis
    if (redis) {
      const cachedData = await redis.get(key);
      if (cachedData) {
        return cachedData as T;
      }
    }
  } catch (err) {
    // Redis error - ignore and fetch fresh
  }

  // 2. Fetch fresh data
  const data = await fetcher();

  try {
    // 3. Save to Redis
    if (redis && data) {
      await redis.set(key, data, { ex: ttl });
    }
  } catch (err) {
    // Redis set error - ignore
  }

  return data;
}