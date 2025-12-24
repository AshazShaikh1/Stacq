import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { rateLimiters, checkRateLimit, getRateLimitIdentifier, getIpAddress } from '@/lib/rate-limit';
import { toggleSave, getUserSaves } from "@/features/social/server/save";

/**
 * POST /api/saves
 * Save or unsave a collection or card
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting: 100 saves/day per user
    const ipAddress = getIpAddress(request);
    const identifier = getRateLimitIdentifier(user.id, ipAddress);
    const rateLimitResult = await checkRateLimit(rateLimiters.saves, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. You can save up to 100 collections per day.',
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

    const { 
      target_type, 
      target_id, 
      collection_id, 
      card_id, 
      stack_id 
    } = await request.json(); // stack_id for legacy support
    
    // Determine target type and ID
    const type = target_type || (card_id ? 'card' : 'collection');
    const id = target_id || collection_id || card_id || stack_id;

    if (!id) {
      return NextResponse.json(
        { error: 'target_id, collection_id, card_id, or stack_id is required' },
        { status: 400 }
      );
    }

    // Verify target exists and is accessible
    if (type === 'collection') {
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('id, is_public, owner_id')
        .eq('id', id)
        .single();

      if (collectionError || !collection) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        );
      }

      // Check if collection is accessible (public or owned by user)
      if (!collection.is_public && collection.owner_id !== user.id) {
        return NextResponse.json(
          { error: 'You cannot save private collections' },
          { status: 403 }
        );
      }
    } else if (type === 'card') {
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .select('id, status')
        .eq('id', id)
        .single();

      if (cardError || !card) {
        return NextResponse.json(
          { error: 'Card not found' },
          { status: 404 }
        );
      }

      // Cards are always saveable (they're public resources)
    }

    // Call server function
    const result = await toggleSave(user.id, type, id, {
      collectionId: type === 'collection' ? (collection_id || id) : undefined,
      cardId: type === 'card' ? (card_id || id) : undefined,
      stackId: stack_id
    });

    return NextResponse.json({ 
      success: true, 
      saved: result.saved,
      saves: result.saves
    });
  } catch (error: any) {
    console.error('Error in saves route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/saves
 * Get saved collections and cards for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Call server function
    const normalizedSaves = await getUserSaves(user.id, limit, offset);

    return NextResponse.json({ saves: normalizedSaves });
  } catch (error: any) {
    console.error('Error in saves GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

