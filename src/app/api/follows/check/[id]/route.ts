import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { getFollowStatus } from "@/features/social/server/follow";

/**
 * GET /api/follows/check/[id]
 * Check if current user follows the specified user (id is the following_id)
 * Returns: { isFollowing: boolean, followerCount: number, followingCount: number }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: following_id } = await params;
    const supabase = await createClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    // Call server function
    // Pass user.id if logged in, otherwise null
    const status = await getFollowStatus(user?.id || null, following_id);

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Error in follow check route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

