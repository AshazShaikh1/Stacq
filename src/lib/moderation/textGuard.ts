/**
 * Content Safety Check (Server-Side Text Guard) - STACQ SHERIFF
 * Part of Stacq Sheriff nuanced moderation system
 * 
 * Uses OpenAI Moderation API with LENIENT thresholds to allow
 * heated debates while blocking extreme hate, threats, and danger.
 * Integrates with strike-based punishment system.
 */

/**
 * Lenient thresholds for nuanced moderation
 * These allow normal arguments/debates while blocking extreme content
 */
const EXTREME_THRESHOLD = 0.90;      // Very high bar for hate/self-harm/sexual
const HARASSMENT_THRESHOLD = 0.99;   // Extremely high bar (allows robust debate)

interface ModerationResult {
  safe: boolean;
  reason?: string;
  categories?: Record<string, number>;
}

/**
 * Check if text content is safe using OpenAI Moderation API
 * 
 * @param text - Combined title + description to check
 * @param userId - User ID for strike tracking (optional)
 * @returns Object with safe boolean and optional reason
 * 
 * LENIENT POLICY:
 * - Allows passionate arguments and strong opinions
 * - Only blocks extreme hate/threats (>90% confidence)
 * - Very high bar for harassment (>99% confidence)
 */
export async function checkContentSafety(
  text: string, 
  userId?: string
): Promise<ModerationResult> {
  if (!text || text.trim().length === 0) {
    return { safe: true };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('[Stacq Sheriff] OPENAI_API_KEY not configured');
      return { safe: true }; // Fail-open if API key missing
    }

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
      }),
    });

    if (!response.ok) {
      console.error('[Stacq Sheriff] OpenAI moderation API error:', response.status);
      return { safe: true }; // Fail-open if API fails
    }

    const data = await response.json();
    const scores = data.results?.[0]?.category_scores || {};

    // LENIENT EVALUATION: Only block extreme content
    const isExtreme = 
      (scores['hate/threatening'] || 0) > EXTREME_THRESHOLD ||
      (scores['self-harm'] || 0) > EXTREME_THRESHOLD ||
      (scores['sexual'] || 0) > EXTREME_THRESHOLD ||
      (scores['harassment'] || 0) > HARASSMENT_THRESHOLD;

    if (isExtreme) {
      // Add strike to user if userId provided
      if (userId) {
        try {
          await addStrike(userId);
        } catch (error) {
          console.error('[Stacq Sheriff] Failed to add strike:', error);
          // Continue with rejection even if strike fails
        }
      }

      return {
        safe: false,
        reason: 'Content violates community guidelines.',
        categories: scores
      };
    }

    // Allow everything else (including moderate harassment/hate)
    return { safe: true };
    
  } catch (error) {
    console.error('[Stacq Sheriff] Content safety check failed:', error);
    return { safe: true }; // Fail-open if check fails
  }
}

/**
 * Add a strike to a user via database function
 * Called when content is rejected by moderation
 * 
 * @param userId - User to penalize
 */
async function addStrike(userId: string): Promise<void> {
  try {
    const { createServiceClient } = await import('@/lib/supabase/api-service');
    const supabase = createServiceClient();

    const { data, error } = await supabase.rpc('add_strike', {
      target_user_id: userId
    });

    if (error) {
      console.error('[Stacq Sheriff] Strike addition failed:', error);
      return;
    }

    // Log strike result
    if (data && data.length > 0) {
      const result = data[0];
      console.log(`[Stacq Sheriff] Strike added to user ${userId}:`, {
        strikes: result.new_strike_count,
        suspended: result.is_suspended,
        until: result.suspended_until
      });
    }
  } catch (error) {
    console.error('[Stacq Sheriff] addStrike error:', error);
  }
}
