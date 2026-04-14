import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProfileRedirect() {
  const supabase = await createClient();

  // Grab the current active user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch their public username
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.username) {
    redirect(`/${profile.username}`);
  } else {
    redirect("/feed");
  }
}
