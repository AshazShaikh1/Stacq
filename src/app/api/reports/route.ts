import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { createServiceClient } from '@/lib/supabase/api-service';
import { rateLimiters, checkRateLimit, getRateLimitIdentifier, getIpAddress } from '@/lib/rate-limit';

// GET: Fetch reports (admin only)
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

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch reports with reporter info
    const { data: reports, error } = await supabase
      .from('reports')
      .select(`
        id,
        reporter_id,
        target_type,
        target_id,
        reason,
        data,
        status,
        created_at,
        reporter:users!reports_reporter_id_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ reports: reports || [] });
  } catch (error) {
    console.error('Error in reports GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new report
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

    // Rate limiting: 10 reports/day per user (prevent spam reporting)
    const ipAddress = getIpAddress(request);
    const identifier = getRateLimitIdentifier(user.id, ipAddress);
    const rateLimitResult = await checkRateLimit(rateLimiters.reports, identifier);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. You can submit up to 10 reports per day.',
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

    const { target_type, target_id, reason, data } = await request.json();

    if (!target_type || !target_id || !reason) {
      return NextResponse.json(
        { error: 'target_type, target_id, and reason are required' },
        { status: 400 }
      );
    }

    if (!['stack', 'card', 'comment', 'user'].includes(target_type)) {
      return NextResponse.json(
        { error: 'target_type must be stack, card, comment, or user' },
        { status: 400 }
      );
    }

    // Validate reason length
    if (reason.trim().length === 0 || reason.length > 500) {
      return NextResponse.json(
        { error: 'Reason must be between 1 and 500 characters' },
        { status: 400 }
      );
    }

    // Check if user already reported this target
    const { data: existingReport } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .eq('status', 'open')
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this item' },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    // Create report
    const { data: newReport, error: reportError } = await serviceClient
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type,
        target_id,
        reason: reason.trim(),
        data: data || {},
        status: 'open',
      })
      .select()
      .single();

    if (reportError) {
      return NextResponse.json(
        { error: reportError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ report: newReport });
  } catch (error) {
    console.error('Error in reports POST route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

