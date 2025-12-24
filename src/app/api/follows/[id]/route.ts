import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/api';
import { getFollowers, getFollowing, unfollowUser } from "@/features/social/server/follow";

/**
 * GET /api/follows/[id]
 * Get followers or following list for a user
 * Query: type=followers|following
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'followers' | 'following';

    if (!type || (type !== 'followers' && type !== 'following')) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }

    const data = type === 'followers' 
      ? await getFollowers(id) 
      : await getFollowing(id);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching follows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/follows/[id]
 * Unfollow a user (id is the following_id)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: following_id } = await params;
    const supabase = await createClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call server function
    await unfollowUser(user.id, following_id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error in unfollow route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

