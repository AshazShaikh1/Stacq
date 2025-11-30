import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { createServiceClient } from '@/lib/supabase/api-service';

/**
 * API route to refresh the explore_ranking materialized view
 * This should be called periodically (every 5-15 minutes) via:
 * - Cron job (Vercel Cron, GitHub Actions, etc.)
 * - Supabase Edge Function with pg_cron
 * - External cron service
 * 
 * For MVP, you can call this manually or set up a simple cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key in header (for GitHub Actions)
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.RANKING_REFRESH_API_KEY;

    // If API key is set, use it for authentication
    if (expectedApiKey && apiKey === expectedApiKey) {
      // API key authentication - proceed
    } else {
      // Fallback to user authentication
      const supabase = await createClient(request);
      const { data: { user } } = await supabase.auth.getUser();

      // For MVP, allow any authenticated user (you can restrict this later)
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Use service client to refresh the materialized view
    const serviceClient = createServiceClient();

    // Call the refresh function
    const { data, error } = await serviceClient.rpc('refresh_explore_ranking');

    if (error) {
      console.error('Error refreshing explore_ranking:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to refresh ranking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Explore ranking refreshed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in refresh-ranking route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also allow GET for easy testing
export async function GET(request: NextRequest) {
  return POST(request);
}

