/**
 * POST /api/workers/ranking/delta
 * Delta recompute worker for real-time ranking updates
 * Feature flag: ranking/final-algo
 */

import { NextRequest, NextResponse } from 'next/server';
import { deltaRecomputeWorker } from '@/lib/ranking/worker';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key authentication for security
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.WORKER_API_KEY;
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { item_type, item_id, debounce_seconds = 5 } = body;

    if (!item_type || !item_id) {
      return NextResponse.json(
        { error: 'item_type and item_id are required' },
        { status: 400 }
      );
    }

    if (item_type !== 'card' && item_type !== 'collection') {
      return NextResponse.json(
        { error: 'Invalid item_type. Must be "card" or "collection"' },
        { status: 400 }
      );
    }

    await deltaRecomputeWorker(item_type as 'card' | 'collection', item_id, debounce_seconds);

    return NextResponse.json({
      success: true,
      item_type,
      item_id,
    });
  } catch (error: any) {
    console.error('Error in ranking delta worker:', error);
    return NextResponse.json(
      { error: error.message || 'Ranking delta update failed' },
      { status: 500 }
    );
  }
}

