import { Redis } from '@upstash/redis';

// Initialize Redis client (Upstash Redis)
// Uses environment variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Cache utility with logging and cache stampede protection
 * Wraps expensive operations with Redis caching
 * 
 * Cache stampede protection: Uses a lock key to prevent multiple concurrent
 * requests from hitting the database when cache expires
 */
export async function cached<T>(
  queryKey: string,
  fetcherFn: () => Promise<T>,
  ttl: number = 60
): Promise<T> {
  const startTime = Date.now();
  const lockKey = `${queryKey}:lock`;
  const lockTTL = 10; // Lock expires after 10 seconds (should be enough for most queries)
  
  // If Redis is not configured, just execute the fetcher
  if (!redis) {
    console.log(`[Cache] Redis not configured, executing directly: ${queryKey}`);
    const data = await fetcherFn();
    const duration = Date.now() - startTime;
    console.log(`[Cache] Direct DB hit: ${queryKey} (${duration}ms)`);
    return data;
  }

  try {
    // Try to get from cache
    const cached = await redis.get(queryKey);
    
    if (cached !== null) {
      const duration = Date.now() - startTime;
      console.log(`[Cache] ✅ Redis HIT: ${queryKey} (${duration}ms)`);
      // Upstash Redis automatically handles JSON serialization/deserialization
      // The value is already parsed, so return it directly
      return cached as T;
    }

    // Cache miss - check for lock (cache stampede protection)
    const lockExists = await redis.exists(lockKey);
    if (lockExists) {
      // Another request is already fetching, wait a bit and retry cache
      console.log(`[Cache] ⏳ Lock exists, waiting for other request: ${queryKey}`);
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms
      
      // Retry cache read
      const retryCached = await redis.get(queryKey);
      if (retryCached !== null) {
        const duration = Date.now() - startTime;
        console.log(`[Cache] ✅ Redis HIT (after lock wait): ${queryKey} (${duration}ms)`);
        return retryCached as T;
      }
      
      // If still not cached, wait a bit more and try one more time
      await new Promise(resolve => setTimeout(resolve, 200));
      const finalRetry = await redis.get(queryKey);
      if (finalRetry !== null) {
        const duration = Date.now() - startTime;
        console.log(`[Cache] ✅ Redis HIT (after second wait): ${queryKey} (${duration}ms)`);
        return finalRetry as T;
      }
    }

    // Set lock to prevent concurrent fetches
    await redis.set(lockKey, '1', { ex: lockTTL });
    console.log(`[Cache] ❌ Redis MISS: ${queryKey} (acquired lock)`);
    
    try {
      // Execute fetcher
      const data = await fetcherFn();
      const duration = Date.now() - startTime;
      
      // Store in cache - Upstash Redis handles JSON serialization automatically
      await redis.set(queryKey, data as any, { ex: ttl });
      console.log(`[Cache] 💾 Cached: ${queryKey} (TTL: ${ttl}s, DB time: ${duration}ms)`);
      
      // Remove lock
      await redis.del(lockKey);
      
      return data;
    } catch (fetchError) {
      // Remove lock on error
      await redis.del(lockKey);
      throw fetchError;
    }
  } catch (error) {
    // If Redis fails, fall back to direct execution
    console.error(`[Cache] Redis error for ${queryKey}, falling back to direct:`, error);
    const data = await fetcherFn();
    const duration = Date.now() - startTime;
    console.log(`[Cache] Direct DB hit (fallback): ${queryKey} (${duration}ms)`);
    return data;
  }
}

/**
 * Invalidate cache by key pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  if (!redis) return;
  
  try {
    // Note: Upstash Redis doesn't support KEYS command in REST API
    // We'll use a simpler approach: store keys with a prefix and track them
    // For now, just log the invalidation request
    console.log(`[Cache] Invalidation requested for pattern: ${pattern}`);
    // In production, you might want to maintain a key registry
  } catch (error) {
    console.error(`[Cache] Error invalidating cache:`, error);
  }
}

/**
 * Clear specific cache key
 */
export async function clearCache(key: string): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.del(key);
    console.log(`[Cache] Cleared: ${key}`);
  } catch (error) {
    console.error(`[Cache] Error clearing cache:`, error);
  }
}

export { redis };

