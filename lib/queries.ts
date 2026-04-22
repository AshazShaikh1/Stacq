/**
 * lib/queries.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised, cached data-fetching functions for server-side use.
 *
 * Each function uses Next.js `unstable_cache` so that:
 *   - Multiple callers in the same request (e.g. generateMetadata + page body)
 *     share a single in-process fetch — zero duplicate DB round-trips.
 *   - The result is stored in the Next.js Data Cache and revalidated every 60 s,
 *     matching the ISR `revalidate = 60` set on each page.
 *
 * ⚠️  These functions are SERVER-ONLY (they import `@/lib/supabase/server`).
 *     Never import them from a Client Component.
 */

import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Profile, Resource, Stacq } from "@/lib/types";

// ─── Internal select strings ─────────────────────────────────────────────────

const STACQ_FULL_SELECT = `
  id, title, description, category, slug, user_id, section_order,
  profiles(id, username, display_name, avatar_url),
  resources(id, title, url, thumbnail, note, section, order_index, user_id, stacq_id)
` as const;

const STACQ_META_SELECT = `
  title, description,
  profiles(display_name, username)
` as const;

const PROFILE_FULL_SELECT =
  "id, username, display_name, avatar_url, bio, social_links, followers_count" as const;

const PROFILE_META_SELECT = "username, display_name, bio" as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type StacqWithRelations = Stacq & {
  profiles: Profile | Profile[];
  resources: Resource[];
};

export type StacqMeta = {
  title: string;
  description: string | null;
  profiles:
    | Pick<Profile, "display_name" | "username">
    | Pick<Profile, "display_name" | "username">[];
};

export type ProfileMeta = Pick<Profile, "username" | "display_name" | "bio">;

// ─── Stacq queries ────────────────────────────────────────────────────────────

/**
 * Fetch full stacq data (content + profile + resources) by slug.
 * Cached for 60 s under the tag `stacq-${slug}`.
 * Both generateMetadata and the page body call this — only 1 DB hit.
 */
export const fetchStacqBySlug = unstable_cache(
  async (slug: string): Promise<StacqWithRelations | null> => {
    const supabase = await createClient();

    // Primary: look up by slug
    const { data: bySlug } = await supabase
      .from("stacqs")
      .select(STACQ_FULL_SELECT)
      .ilike("slug", slug)
      .maybeSingle();

    if (bySlug) return bySlug as unknown as StacqWithRelations;

    // Fallback: legacy UUID-based stacqs
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slug,
      );
    if (!isUuid) return null;

    const { data: byId } = await supabase
      .from("stacqs")
      .select(STACQ_FULL_SELECT)
      .eq("id", slug)
      .maybeSingle();

    return (byId as unknown as StacqWithRelations) ?? null;
  },
  // Cache key factory — one entry per slug
  ["stacq-by-slug"],
  { revalidate: 60, tags: ["stacq"] },
);

/**
 * Lightweight stacq fetch for metadata only.
 * Separate from the full fetch so ISR metadata builds stay fast.
 */
export const fetchStacqMetaBySlug = unstable_cache(
  async (slug: string): Promise<StacqMeta | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("stacqs")
      .select(STACQ_META_SELECT)
      .ilike("slug", slug)
      .maybeSingle();
    return (data as unknown as StacqMeta) ?? null;
  },
  ["stacq-meta-by-slug"],
  { revalidate: 60, tags: ["stacq"] },
);

// ─── Profile queries ──────────────────────────────────────────────────────────

/**
 * Fetch a full profile (with stacq feed) by username.
 * Cached for 60 s under `profile-${username}`.
 */
export const fetchProfileByUsername = unstable_cache(
  async (username: string): Promise<Profile | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_FULL_SELECT)
      .ilike("username", username)
      .maybeSingle();
    return (data as Profile) ?? null;
  },
  ["profile-by-username"],
  { revalidate: 60, tags: ["profile"] },
);

/**
 * Lightweight profile fetch for metadata only.
 */
export const fetchProfileMetaByUsername = unstable_cache(
  async (username: string): Promise<ProfileMeta | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select(PROFILE_META_SELECT)
      .ilike("username", username)
      .maybeSingle();
    return (data as ProfileMeta) ?? null;
  },
  ["profile-meta-by-username"],
  { revalidate: 60, tags: ["profile"] },
);

/**
 * Fetch all stacqs for a user ID, with thumbnail resources for feed cards.
 * Cached separately so profile header and feed can revalidate independently.
 */
export const fetchStacqsByUserId = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("stacqs")
      .select(
        `
        id, slug, title, category,
        profiles(username, avatar_url),
        resources(id, thumbnail)
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return data ?? [];
  },
  ["stacqs-by-user-id"],
  { revalidate: 60, tags: ["stacq", "profile"] },
);
