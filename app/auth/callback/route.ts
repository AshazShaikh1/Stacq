import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // FALLBACK: Ensure a profile record exists for this user to prevent 404s
        // This handles cases where the Supabase database trigger might have failed.
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          const meta = user.user_metadata;
          const email = user.email || "";
          const username =
            meta.username ||
            email
              .split("@")[0]
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "_");
          const displayName = meta.full_name || meta.display_name || username;

          await supabase.from("profiles").upsert(
            [
              {
                id: user.id,
                username,
                email,
                display_name: displayName,
                avatar_url: meta.avatar_url || "",
                followers_count: 0,
              },
            ],
            { onConflict: "id" },
          );
        }
      }

      return NextResponse.redirect(`${origin}/feed`);
    }

    console.error("Auth error in callback:", error.message);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
