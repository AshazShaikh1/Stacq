import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { stripe, getPrice, getDurationDays, PaymentType } from '@/lib/stripe';

/**
 * POST /api/payments/checkout
 * Create a Stripe Checkout session
 * Body: { type: PaymentType, duration?: string, collection_id?: string, stack_id?: string, username?: string }
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

    const body = await request.json();
    const { type, duration, collection_id, stack_id, username } = body;
    const id = collection_id || stack_id; // Support both

    if (!type) {
      return NextResponse.json(
        { error: 'Payment type is required' },
        { status: 400 }
      );
    }

    // Validate payment type
    const validTypes: PaymentType[] = ['promote', 'reserve_username', 'hidden_stack', 'featured_stacker'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid payment type' },
        { status: 400 }
      );
    }

    // Validate type-specific requirements
    if (type === 'promote' || type === 'hidden_stack' || type === 'featured_stacker') {
      if (!duration) {
        return NextResponse.json(
          { error: 'Duration is required for this payment type' },
          { status: 400 }
        );
      }
    }

    if (type === 'promote' || type === 'hidden_stack') {
      if (!id) {
        return NextResponse.json(
          { error: 'collection_id or stack_id is required for this payment type' },
          { status: 400 }
        );
      }

      // Verify collection exists and belongs to user (try collections first, fallback to stacks)
      const { data: collection, error: collectionError } = await supabase
        .from('collections')
        .select('id, owner_id, title')
        .eq('id', id)
        .single();

      if (collectionError || !collection) {
        // Fallback to stacks for legacy support
        const { data: stack, error: stackError } = await supabase
          .from('stacks')
          .select('id, owner_id, title')
          .eq('id', id)
          .single();

        if (stackError || !stack) {
          return NextResponse.json(
            { error: 'Collection not found' },
            { status: 404 }
          );
        }

        if (stack.owner_id !== user.id) {
          return NextResponse.json(
            { error: 'You can only promote your own collections' },
            { status: 403 }
          );
        }
      } else {
        if (collection.owner_id !== user.id) {
          return NextResponse.json(
            { error: 'You can only promote your own collections' },
            { status: 403 }
          );
        }
      }
    }

    if (type === 'reserve_username') {
      if (!username) {
        return NextResponse.json(
          { error: 'username is required for username reservation' },
          { status: 400 }
        );
      }

      // Verify username is available
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    // Calculate price
    const amount = getPrice(type, duration);
    const durationDays = duration ? getDurationDays(duration) : null;

    // Create Stripe Checkout session
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: getProductName(type, duration),
              description: getProductDescription(type, duration, id, username),
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payment/cancel`,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        type,
        duration: duration || '',
        collection_id: collection_id || '',
        stack_id: stack_id || '', // Legacy support
        username: username || '',
        duration_days: durationDays?.toString() || '',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

function getProductName(type: PaymentType, duration?: string): string {
  switch (type) {
    case 'promote':
      return `Promote Collection - ${duration || '7 days'}`;
    case 'reserve_username':
      return 'Reserve Username';
    case 'hidden_stack':
      return `Hidden Collection - ${duration || '30 days'}`;
    case 'featured_stacker':
      return `Featured Creator - ${duration || '7 days'}`;
    default:
      return 'Payment';
  }
}

function getProductDescription(type: PaymentType, duration?: string, collection_id?: string, username?: string): string {
  switch (type) {
    case 'promote':
      return `Promote your collection to appear at the top of explore feeds for ${duration || '7 days'}`;
    case 'reserve_username':
      return `Reserve the username "${username}" permanently`;
    case 'hidden_stack':
      return `Make your collection hidden (paid feature) for ${duration || '30 days'}`;
    case 'featured_stacker':
      return `Feature your profile as a top creator for ${duration || '7 days'}`;
    default:
      return '';
  }
}

