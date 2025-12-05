import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { createServiceClient } from '@/lib/supabase/api-service';
import { rateLimiters, checkRateLimit, getRateLimitIdentifier, getIpAddress } from '@/lib/rate-limit';

/**
 * POST /api/collections/[id]/clone
 * Clone a public collection as a private collection for the current user
 * 
 * Requirements:
 * - Collection must be public (is_public = true)
 * - User must be authenticated
 * - Rate limit: 10 clones/day per user
 * - Clone is private by default (is_public = false)
 * - Copies: title, description, cover_image_url, tags, and all cards
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting: 10 clones/day per user (PRD requirement)
    const ipAddress = getIpAddress(request);
    const identifier = getRateLimitIdentifier(user.id, ipAddress);
    const rateLimitResult = await checkRateLimit(rateLimiters.clones, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. You can clone up to 10 collections per day.',
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

    // Fetch the original collection (try by id first, then by slug)
    let { data: originalCollection, error: collectionError } = await supabase
      .from('collections')
      .select(`
        id,
        title,
        description,
        cover_image_url,
        is_public,
        owner_id
      `)
      .eq('id', id)
      .maybeSingle();

    // If not found by id, try by slug
    if (!originalCollection && !collectionError) {
      const { data: collectionBySlug, error: slugError } = await supabase
        .from('collections')
        .select(`
          id,
          title,
          description,
          cover_image_url,
          is_public,
          owner_id
        `)
        .eq('slug', id)
        .maybeSingle();
      
      originalCollection = collectionBySlug;
      collectionError = slugError;
    }

    if (collectionError || !originalCollection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Only allow cloning public collections
    if (!originalCollection.is_public) {
      return NextResponse.json(
        { error: 'Only public collections can be cloned' },
        { status: 403 }
      );
    }

    // Prevent users from cloning their own collections
    if (originalCollection.owner_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot clone your own collection' },
        { status: 400 }
      );
    }

    // Check if user already cloned this collection
    const { data: existingClone } = await supabase
      .from('clones')
      .select('id')
      .eq('cloner_id', user.id)
      .or(`original_stack_id.eq.${id},original_collection_id.eq.${id}`)
      .maybeSingle();

    if (existingClone) {
      return NextResponse.json(
        { error: 'You have already cloned this collection' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Generate unique slug
    const baseSlug = originalCollection.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
    
    let slug = `${baseSlug}-${Date.now()}`;
    let slugExists = true;
    let attempts = 0;

    // Ensure slug is unique
    while (slugExists && attempts < 10) {
      const { data: existing } = await serviceClient
        .from('collections')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
      if (!existing) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        attempts++;
      }
    }

    // Create the cloned collection (private by default)
    const { data: clonedCollection, error: createError } = await serviceClient
      .from('collections')
      .insert({
        owner_id: user.id,
        title: `${originalCollection.title} (Clone)`,
        description: originalCollection.description,
        cover_image_url: originalCollection.cover_image_url,
        slug,
        is_public: false, // Clones are private by default
        is_hidden: false,
        stats: { views: 0, upvotes: 0, saves: 0, comments: 0 },
      })
      .select()
      .single();

    if (createError || !clonedCollection) {
      console.error('Error creating cloned collection:', createError);
      return NextResponse.json(
        { error: 'Failed to create cloned collection' },
        { status: 500 }
      );
    }

    // Copy tags from original collection
    const { data: originalTags } = await supabase
      .from('collection_tags')
      .select('tag_id')
      .eq('collection_id', id);

    if (originalTags && originalTags.length > 0) {
      const tagMappings = originalTags.map((ct: any) => ({
        collection_id: clonedCollection.id,
        tag_id: ct.tag_id,
      }));

      await serviceClient
        .from('collection_tags')
        .insert(tagMappings);
    }

    // Copy all cards from original collection
    const { data: originalCards } = await supabase
      .from('collection_cards')
      .select('card_id')
      .eq('collection_id', id);

    if (originalCards && originalCards.length > 0) {
      const cardMappings = originalCards.map((cc: any) => ({
        collection_id: clonedCollection.id,
        card_id: cc.card_id,
        added_by: user.id,
      }));

      await serviceClient
        .from('collection_cards')
        .insert(cardMappings);
    }

    // Create clone record (support both stack_id and collection_id for migration period)
    await serviceClient
      .from('clones')
      .insert({
        original_collection_id: id,
        new_collection_id: clonedCollection.id,
        cloner_id: user.id,
      });

    return NextResponse.json({
      success: true,
      collection: {
        id: clonedCollection.id,
        slug: clonedCollection.slug,
        title: clonedCollection.title,
      },
    });
  } catch (error) {
    console.error('Error in clone route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

