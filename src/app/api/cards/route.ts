import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { createServiceClient } from '@/lib/supabase/api-service';

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

    // Normalize URL (basic - use normalize-url library in production)
    const normalizedUrl = new URL(url).href;

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

    return NextResponse.json({ success: true, card_id: cardId });
  } catch (error) {
    console.error('Error in cards route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

