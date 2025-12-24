import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { markAllAsRead } from "@/features/notifications/server/notifications";

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user
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

    // Call server function
    await markAllAsRead(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in read-all route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

