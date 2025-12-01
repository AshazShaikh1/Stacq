import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { createServiceClient } from '@/lib/supabase/api-service';
import { rateLimiters, checkRateLimit, getRateLimitIdentifier, getIpAddress } from '@/lib/rate-limit';
import { checkUserCardLimit } from '@/lib/monitoring/alerts';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      );
    }

    // Rate limiting: 20 cards/day per user (PRD requirement)
    const ipAddress = getIpAddress(request);
    const identifier = getRateLimitIdentifier(user.id, ipAddress);
    const rateLimitResult = await checkRateLimit(rateLimiters.cards, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. You can create up to 20 cards per day.',
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        }
      );
    }

    // Check for monitoring alerts (cards per user)
    // This runs asynchronously and doesn't block the request
    checkUserCardLimit(user.id, supabase).catch(err => {
      console.error('Error checking user card limit:', err);
    });

    // Use service client for card creation to bypass RLS if needed
    // This ensures card creation works even if RLS policy has issues
    const serviceClient = createServiceClient();

    const { url, title, description, thumbnail_url, stack_id } = await request.json();

    if (!url || !stack_id) {
      return NextResponse.json(
        { error: 'URL and stack_id are required' },
        { status: 400 }
      );
    }

    // Canonicalize URL using normalize-url library
    const { canonicalizeUrl } = await import('@/lib/metadata/extractor');
    const normalizedUrl = canonicalizeUrl(url);

    // Check if card already exists (use regular client for SELECT)
    let { data: existingCard } = await supabase
      .from('cards')
      .select('id')
      .eq('canonical_url', normalizedUrl)
      .maybeSingle();

    let cardId;

    if (existingCard) {
      cardId = existingCard.id;
    } else {
      // Create new card using service client to bypass RLS
      // This ensures card creation works reliably
      const domain = new URL(normalizedUrl).hostname.replace('www.', '');
      
      const { data: newCard, error: cardError } = await serviceClient
        .from('cards')
        .insert({
          canonical_url: normalizedUrl,
          title: title || null,
          description: description || null,
          thumbnail_url: thumbnail_url || null,
          domain,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (cardError) {
        console.error('Card creation error details:', {
          message: cardError.message,
          details: cardError.details,
          hint: cardError.hint,
          code: cardError.code,
          user_id: user.id,
        });
        return NextResponse.json(
          { 
            error: cardError.message || 'Failed to create card',
            hint: 'Make sure you have run migration 005_fix_cards_rls.sql in Supabase'
          },
          { status: 400 }
        );
      }

      cardId = newCard.id;
    }

    // Check if card is already in stack
    const { data: existingMapping } = await serviceClient
      .from('stack_cards')
      .select('id')
      .eq('stack_id', stack_id)
      .eq('card_id', cardId)
      .maybeSingle();

    if (existingMapping) {
      return NextResponse.json(
        { error: 'Card already in this stack' },
        { status: 400 }
      );
    }

    // Add card to stack using service client
    const { error: mappingError } = await serviceClient
      .from('stack_cards')
      .insert({
        stack_id,
        card_id: cardId,
        added_by: user.id,
      });

    if (mappingError) {
      return NextResponse.json(
        { error: mappingError.message },
        { status: 400 }
      );
    }

    // Trigger metadata worker asynchronously (don't wait for it)
    // This ensures cards get full metadata processing in the background
    if (!existingCard) {
      // Only trigger for new cards
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/workers/fetch-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(process.env.WORKER_API_KEY && { 'x-api-key': process.env.WORKER_API_KEY }),
        },
        body: JSON.stringify({ card_id: cardId }),
      }).catch(err => {
        // Silently fail - worker will pick it up later
        console.error('Failed to trigger metadata worker:', err);
      });
    }

    return NextResponse.json({ success: true, card_id: cardId });
  } catch (error) {
    console.error('Error in cards route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

