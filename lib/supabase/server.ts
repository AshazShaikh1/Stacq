import { createServerClient, createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    },
  );

  return supabase;
}

/**
 * createPublicClient
 * ──────────────────────────────────────────────────────────────────────────────
 * A cookie-free Supabase client using the anon key only.
 * Safe to call inside `unstable_cache` because it doesn't touch `cookies()`.
 *
 * Use this for cached queries that read public data (stacqs, profiles).
 * Public rows are accessible via the anon key through RLS.
 * For anything requiring auth context (user-specific data), use createClient().
 */
export function createPublicClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
