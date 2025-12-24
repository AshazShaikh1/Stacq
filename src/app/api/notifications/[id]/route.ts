import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { markAsRead } from "@/features/notifications/server/notifications";

/**
 * PATCH /api/notifications/[id]
 * Mark a notification as read
 * Body: { read: boolean }
 */
export async function PATCH(
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

    const body = await request.json();
    const { read } = body;

    if (typeof read !== 'boolean') {
      return NextResponse.json(
        { error: 'read must be a boolean' },
        { status: 400 }
      );
    }

    // Only allow setting read=true for now (which is what the feature usually entails)
    // If needed to unread, we can expand, but repo `markAsRead` only sets to true.
    if (!read) {
         // Optionally support unreading if desired, but for now `markAsRead` assumes true.
         // Current UI only supports marking as read.
         return NextResponse.json({ success: true }); // No-op
    }

    // Call server function
    try {
        const updatedNotification = await markAsRead(user.id, id);
        return NextResponse.json({ notification: updatedNotification });
    } catch (e: any) {
        // If repo throws because record not found or not owned
        return NextResponse.json(
            { error: 'Failed to update notification' },
            { status: 500 }
        );
    }

  } catch (error: any) {
    console.error('Unexpected error updating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

