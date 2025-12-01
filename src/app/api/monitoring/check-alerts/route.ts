import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/api-service';
import { checkVotesSurge, checkExtensionSavesSpike } from '@/lib/monitoring/alerts';

/**
 * POST /api/monitoring/check-alerts
 * Check for anomalies and trigger alerts
 * This endpoint should be called by a scheduled job (e.g., GitHub Actions, cron)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is called from an authorized source (e.g., GitHub Actions secret)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.MONITORING_SECRET;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const results: Record<string, boolean> = {};

    // Check votes surge
    results.votesSurge = await checkVotesSurge(supabase);

    // Check extension saves spike
    results.extensionSavesSpike = await checkExtensionSavesSpike(supabase);

    return NextResponse.json({
      success: true,
      checks: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error checking alerts:', error);
    return NextResponse.json(
      { error: 'Failed to check alerts' },
      { status: 500 }
    );
  }
}

