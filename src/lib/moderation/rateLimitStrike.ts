/**
 * Rate Limit Strike Integration
 * Part of Stacq Sheriff moderation system
 * 
 * Adds strikes to users who exceed rate limits (spam behavior)
 */

import { createServiceClient } from '@/lib/supabase/api-service';

/**
 * Add a strike to a user for rate limit violation
 * Called when user exceeds API rate limits
 * 
 * @param userId - User ID to penalize
 */
export async function addRateLimitStrike(userId: string): Promise<void> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase.rpc('add_strike', {
      target_user_id: userId
    });

    if (error) {
      console.error('[Stacq Sheriff] Rate limit strike failed:', error);
      return;
    }

    // Log strike result
    if (data && data.length > 0) {
      const result = data[0];
      console.log(`[Stacq Sheriff] Rate limit strike added to user ${userId}:`, {
        strikes: result.new_strike_count,
        suspended: result.is_suspended,
        until: result.suspended_until
      });
    }
  } catch (error) {
    console.error('[Stacq Sheriff] addRateLimitStrike error:', error);
  }
}
