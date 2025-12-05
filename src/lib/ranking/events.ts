/**
 * Ranking Events - Log events that affect ranking
 * Feature flag: ranking/final-algo
 */

import { createServiceClient } from '@/lib/supabase/api-service';
import { isFeatureEnabled } from '@/lib/feature-flags';

/**
 * Log a ranking event (non-blocking)
 */
export async function logRankingEvent(
  itemType: 'card' | 'collection',
  itemId: string,
  eventType: 'upvote' | 'save' | 'comment' | 'visit' | 'promotion' | 'unvote' | 'unsave'
): Promise<void> {
  // Only log if feature flag is enabled
  if (!isFeatureEnabled('ranking/final-algo')) {
    return;
  }

  try {
    const supabase = createServiceClient();
    
    // Use the database function to log the event
    await supabase.rpc('log_ranking_event', {
      p_item_type: itemType,
      p_item_id: itemId,
      p_event_type: eventType,
    });

    // Trigger delta recompute (non-blocking, fire and forget)
    // Use a small delay to debounce rapid events
    setTimeout(async () => {
      try {
        const workerUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/workers/ranking/delta`;
        await fetch(workerUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.WORKER_API_KEY && { 'x-api-key': process.env.WORKER_API_KEY }),
          },
          body: JSON.stringify({
            item_type: itemType,
            item_id: itemId,
            debounce_seconds: 5,
          }),
        });
      } catch (error) {
        // Silently fail - worker will pick it up on next full recompute
        console.error('[Ranking Events] Failed to trigger delta worker:', error);
      }
    }, 2000); // 2 second debounce
  } catch (error) {
    // Silently fail - events will be processed on next full recompute
    console.error('[Ranking Events] Failed to log event:', error);
  }
}

