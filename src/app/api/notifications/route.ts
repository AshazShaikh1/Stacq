import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { getNotifications } from "@/features/notifications/server/notifications";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call server function
    const notifications = await getNotifications(user.id, 50);

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error('Unexpected error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
