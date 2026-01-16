import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/api";
import { createServiceClient } from "@/lib/supabase/api-service";
import {
  rateLimiters,
  checkRateLimit,
  getRateLimitIdentifier,
  getIpAddress,
} from "@/lib/rate-limit";
import { checkShadowban } from "@/lib/anti-abuse/fingerprinting";

import { toggleVote } from "@/features/social/server/vote";

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

    // Rate limiting: 100 votes/day per user
    const ipAddress = getIpAddress(request);
    const identifier = getRateLimitIdentifier(user.id, ipAddress);
    const rateLimitResult = await checkRateLimit(
      rateLimiters.votes,
      identifier
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. You can cast up to 100 votes per day.",
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
          },
        }
      );
    }

    const { target_type, target_id } = await request.json();

    if (!target_type || !target_id) {
      return NextResponse.json(
        { error: "target_type and target_id are required" },
        { status: 400 }
      );
    }

    // Accept 'stack', 'card', or 'collection'
    if (!["stack", "card", "collection"].includes(target_type)) {
      return NextResponse.json(
        { error: 'target_type must be "stack", "card", or "collection"' },
        { status: 400 }
      );
    }

    // Check if user is shadowbanned
    const serviceClient = createServiceClient();
    const isShadowbanned = await checkShadowban(serviceClient, user.id);
    if (isShadowbanned) {
      return NextResponse.json(
        { error: "Action not allowed" },
        { status: 403 }
      );
    }

    // Call server function
    const result = await toggleVote(user.id, target_type, target_id);

    return NextResponse.json({ success: true, voted: result.voted });
  } catch (error: any) {
    console.error("Error in votes route:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
