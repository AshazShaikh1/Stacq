/**
 * app/sitemap.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamic sitemap covering all public pages on stacq.in.
 *
 * Design decisions:
 *
 * 1. Service-role client — bypasses RLS and anon rate limits. The sitemap
 *    is a build/ISR artefact, not a user request, so it never touches cookies.
 *    We use the service role key so even rows not visible to anon users are
 *    included (e.g. profiles without public stacqs that still have public URLs).
 *
 * 2. Both DB fetches run in parallel (Promise.all) — total query time is
 *    max(profiles_query, stacqs_query), not the sum. Keeps the sitemap well
 *    under the 500ms target.
 *
 * 3. ISR revalidation: Next.js caches the sitemap response. We export
 *    `revalidate = 3600` (1 hour) so it stays fresh without hammering the DB.
 *
 * 4. Only selects the exact columns needed — no SELECT * waste.
 *
 * New handles and vaults appear automatically on the next revalidation cycle.
 */

import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

// ─── ISR: rebuild sitemap at most once per hour ───────────────────────────────
export const revalidate = 3600;

// ─── Base URL ─────────────────────────────────────────────────────────────────
const BASE_URL = "https://stacq.in";

// ─── Service-role client (no cookies, no RLS) ─────────────────────────────────
// SUPABASE_SERVICE_ROLE_KEY is a server-only secret — never exposed to the
// browser because this file only runs in the Node.js / edge runtime.
function createSitemapClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    // Graceful fallback to anon key if service role not configured yet.
    // Anon key still works for public tables; service role is preferred for
    // complete coverage and to avoid hitting RLS / rate limits.
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "[sitemap] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ─── Static routes ────────────────────────────────────────────────────────────
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  {
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/explore`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 0.9,
  },
  {
    url: `${BASE_URL}/about`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.5,
  },
];

// ─── Sitemap ──────────────────────────────────────────────────────────────────
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSitemapClient();

  // Fetch profiles and vaults in parallel — not sequential
  const [profilesResult, stacqsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("username, updated_at, created_at")
      .not("username", "is", null)
      .order("updated_at", { ascending: false }),

    supabase
      .from("stacqs")
      .select("slug, updated_at, created_at")
      .not("slug", "is", null)
      .order("updated_at", { ascending: false }),
  ]);

  // ── Profile entries (/[username]) ──────────────────────────────────────────
  const profileEntries: MetadataRoute.Sitemap = (profilesResult.data ?? []).map(
    (p) => ({
      url: `${BASE_URL}/${p.username}`,
      lastModified: new Date(p.updated_at ?? p.created_at ?? Date.now()),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }),
  );

  // ── Vault entries (/stacq/[slug]) ─────────────────────────────────────────
  const stacqEntries: MetadataRoute.Sitemap = (stacqsResult.data ?? []).map(
    (s) => ({
      url: `${BASE_URL}/stacq/${s.slug}`,
      lastModified: new Date(s.updated_at ?? s.created_at ?? Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }),
  );

  return [...STATIC_ROUTES, ...profileEntries, ...stacqEntries];
}
