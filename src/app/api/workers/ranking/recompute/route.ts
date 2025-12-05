/**
 * POST /api/workers/ranking/recompute
 * Full recompute worker for ranking scores
 * Feature flag: ranking/final-algo
 */

import { NextRequest, NextResponse } from 'next/server';
import { fullRecomputeWorker, refreshRankingView } from '@/lib/ranking/worker';

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

    const body = await request.json().catch(() => ({}));
    const { item_type, changed_since_days = 30, dry_run = false } = body;

    if (item_type && item_type !== 'card' && item_type !== 'collection') {
      return NextResponse.json(
        { error: 'Invalid item_type. Must be "card" or "collection"' },
        { status: 400 }
      );
    }

    const results: any = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
    };

    // Process both types if not specified
    const types: ('card' | 'collection')[] = item_type 
      ? [item_type as 'card' | 'collection']
      : ['card', 'collection'];

    for (const type of types) {
      const typeResults = await fullRecomputeWorker(type, changed_since_days, dry_run);
      results.processed += typeResults.processed;
      results.succeeded += typeResults.succeeded;
      results.failed += typeResults.failed;
      results.errors.push(...typeResults.errors);
    }

    // Refresh materialized view
    if (!dry_run) {
      await refreshRankingView();
    }

    return NextResponse.json({
      success: true,
      dry_run: dry_run,
      ...results,
    });
  } catch (error: any) {
    console.error('Error in ranking recompute worker:', error);
    return NextResponse.json(
      { error: error.message || 'Ranking recompute failed' },
      { status: 500 }
    );
  }
}

