import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { toggleFollow } from "@/features/social/server/follow";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: following_id } = await request.json();

    if (!following_id) {
      return NextResponse.json(
        { error: "following_id is required" },
        { status: 400 }
      );
    }

    if (user.id === following_id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("id, username")
      .eq("id", following_id)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Call server function
    try {
      const result = await toggleFollow(user.id, following_id);
      return NextResponse.json({
        success: true,
        follow: result.follow,
      });
    } catch (err: any) {
      if (err.message === "Already following this user") {
        return NextResponse.json(
          { error: "Already following this user" },
          { status: 400 }
        );
      }
      throw err;
    }

  } catch (error: any) {
    console.error("Error in follows route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
