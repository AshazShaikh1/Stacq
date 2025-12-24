import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { getUnreadCount } from "@/features/notifications/server/notifications";

/**
 * GET /api/notifications/unread-count
 * Get the count of unread notifications for the current user
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

    // Call server function
    const count = await getUnreadCount(user.id);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Unexpected error in unread-count route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

