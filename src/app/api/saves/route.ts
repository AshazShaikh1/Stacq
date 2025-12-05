import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { createServiceClient } from '@/lib/supabase/api-service';
import { rateLimiters, checkRateLimit, getRateLimitIdentifier, getIpAddress } from '@/lib/rate-limit';
import { logRankingEvent } from '@/lib/ranking/events';

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

    const serviceClient = createServiceClient();

    // Check if already saved - use target_type and target_id (new) or legacy columns
    const { data: existingSave } = await serviceClient
      .from('saves')
      .select('id')
      .eq('user_id', user.id)
      .eq('target_type', type)
      .eq('target_id', id)
      .maybeSingle();

    if (existingSave) {
      // Unsave (delete)
      await serviceClient
        .from('saves')
        .delete()
        .eq('id', existingSave.id);

      // Get updated save count
      const { count: saveCount } = await serviceClient
        .from('saves')
        .select('*', { count: 'exact', head: true })
        .eq('target_type', type)
        .eq('target_id', id);

      // Log ranking event
      await logRankingEvent(type as 'card' | 'collection', id, 'unsave');

      // Trigger delta recompute for ranking (async, don't wait)
      if (process.env.NEXT_PUBLIC_RANKING_FEATURE_FLAG === 'true' || process.env.RANKING_FINAL_ALGO === 'true') {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/workers/ranking/delta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_type: type,
            item_id: id,
          }),
        }).catch(err => {
          console.error('Failed to trigger ranking delta recompute:', err);
          // Don't fail the unsave if ranking update fails
        });
      }

      return NextResponse.json({ 
        success: true, 
        saved: false,
        saves: saveCount || 0
      });
    } else {
      // Save (insert)
      const { error: saveError } = await serviceClient
        .from('saves')
        .insert({
          user_id: user.id,
          target_type: type,
          target_id: id,
          collection_id: type === 'collection' ? (collection_id || id) : null,
          card_id: type === 'card' ? (card_id || id) : null,
          stack_id: stack_id, // Legacy support
        });

      if (saveError) {
        return NextResponse.json(
          { error: saveError.message },
          { status: 400 }
        );
      }

      // Get updated save count
      const { count: saveCount } = await serviceClient
        .from('saves')
        .select('*', { count: 'exact', head: true })
        .eq('target_type', type)
        .eq('target_id', id);

      // Log ranking event
      await logRankingEvent(type as 'card' | 'collection', id, 'save');

      // Trigger delta recompute for ranking (async, don't wait)
      if (process.env.NEXT_PUBLIC_RANKING_FEATURE_FLAG === 'true' || process.env.RANKING_FINAL_ALGO === 'true') {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/workers/ranking/delta`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_type: type,
            item_id: id,
          }),
        }).catch(err => {
          console.error('Failed to trigger ranking delta recompute:', err);
          // Don't fail the save if ranking update fails
        });
      }

      return NextResponse.json({ 
        success: true, 
        saved: true,
        saves: saveCount || 0
      });
    }
  } catch (error) {
    console.error('Error in saves route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Get saved items (collections and cards)
    const { data: saves, error } = await supabase
      .from('saves')
      .select(`
        id,
        target_type,
        target_id,
        created_at,
        collection:collections!saves_collection_id_fkey (
          id,
          title,
          description,
          slug,
          cover_image_url,
          is_public,
          stats,
          owner_id,
          created_at,
          owner:users!collections_owner_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        ),
        card:cards!saves_card_id_fkey (
          id,
          title,
          description,
          thumbnail_url,
          canonical_url,
          domain,
          metadata
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Normalize saves to include the target item
    const normalizedSaves = saves?.map(save => ({
      ...save,
      item: save.target_type === 'collection' ? save.collection : save.card,
    })) || [];

    return NextResponse.json({ saves: normalizedSaves });
  } catch (error) {
    console.error('Error in saves GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

