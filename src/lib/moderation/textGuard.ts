/**
 * Content Safety Check (Server-Side Text Guard)
 * Part of Stacq Sentinel automated moderation system
 * 
 * Uses OpenAI Moderation API to detect unsafe content in text
 * before allowing creation of cards and collections.
 */

/**
 * Check if text content is safe using OpenAI Moderation API
 * 
 * @param text - Combined title + description to check
 * @returns true if content is safe, false if unsafe/flagged
 * 
 * Uses OpenAI's free moderation endpoint to detect:
 * - Hate speech
 * - Harassment
 * - Self-harm
 * - Sexual content
 * - Violence
 */
export async function checkContentSafety(text: string): Promise<boolean> {
  if (!text || text.trim().length === 0) {
    return true; // Empty content is safe
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.error('[Stacq Sentinel] OPENAI_API_KEY not configured');
      return true; // Fail-open: allow content if API key is missing
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
      console.error('[Stacq Sentinel] OpenAI moderation API error:', response.status);
      return true; // Fail-open: allow content if API fails
    }

    const data = await response.json();
    
    // Check if content was flagged
    const isFlagged = data.results?.[0]?.flagged || false;
    
    // Return inverse: true = safe, false = unsafe
    return !isFlagged;
    
  } catch (error) {
    console.error('[Stacq Sentinel] Content safety check failed:', error);
    return true; // Fail-open: allow content if check fails
  }
}
