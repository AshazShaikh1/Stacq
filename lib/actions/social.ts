"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleFollow(followingId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in to follow users." };

  if (user.id === followingId)
    return { error: "You cannot formally follow yourself." };

  // Analyze existing graph link
  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .single();

  if (existing) {
    // Destroy active edge
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("id", existing.id);

    if (error) return { error: error.message };

    revalidatePath("/");
    revalidatePath("/[username]", "page");
    return { success: true, following: false };
  } else {
    // Construct brand new directional connection
    const { error } = await supabase
      .from("follows")
      .insert([{ follower_id: user.id, following_id: followingId }]);

    if (error) return { error: error.message };

    revalidatePath("/");
    revalidatePath("/[username]", "page");
    return { success: true, following: true };
  }
}
