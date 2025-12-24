import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { FeedGrid } from "@/components/feed/FeedGrid"; // Keep this if used elsewhere? It's not used anymore in this file, but removing it might be safer to do in the other chunk or let it be. Actually ProfilePage doesn't use FeedGrid anymore, it uses ProfileFeedClient.
import { ProfileFeedClient } from "@/components/profile/ProfileFeedClient";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profileUser } = await supabase
    .from("users")
    .select("display_name, avatar_url")
    .eq("username", username)
    .single();

  if (!profileUser) {
    return generateSEOMetadata({
      title: "Not Found",
      description: "Profile not found",
    });
  }

  return generateSEOMetadata({
    title: `${profileUser.display_name} (@${username})`,
    description: `View profile on Stacq`,
    image: profileUser.avatar_url || undefined,
    url: `/profile/${username}`,
  });
}

export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { username } = await params;
  const { tab: tabParam } = await searchParams;
  const tab = tabParam || "collection";

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // 1. Fetch Profile
  const { data: profileUser, error } = await supabase
    .from("users")
    .select("id, username, display_name, avatar_url, role")
    .eq("username", username)
    .single();

  if (error || !profileUser) notFound();

  const isOwnProfile = currentUser?.id === profileUser.id;

  // 2. Fetch Stats
  const [created, saved, upvotes, views, followers, following] =
    await Promise.all([
      supabase
        .from("collections")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", profileUser.id),
      supabase
        .from("saves")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profileUser.id),
      supabase
        .from("votes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profileUser.id),
      supabase
        .from("collections")
        .select("stats")
        .eq("owner_id", profileUser.id),
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", profileUser.id),
      supabase
        .from("follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", profileUser.id),
    ]);

  const totalViews =
    views.data?.reduce((sum, c: any) => sum + (c.stats?.views || 0), 0) || 0;

  const profile = {
    ...profileUser,
    stats: {
      collections_created: created.count || 0,
      collections_saved: saved.count || 0,
      total_upvotes: upvotes.count || 0,
      total_views: totalViews,
      followers: followers.count || 0,
      following: following.count || 0,
    },
  };

  // 3. Fetch Feed Data
  let feedItems: any[] = [];

  if (tab === "card" || tab === "cards") {
    let query = supabase
      .from("cards")
      .select(
        `
      id, title, description, thumbnail_url, canonical_url, domain, created_at, created_by, is_public,
      upvotes_count, saves_count, creator:users!cards_created_by_fkey(username, display_name, avatar_url)
    `
      )
      .eq("created_by", profileUser.id)
      .eq("status", "active");

    if (!isOwnProfile) query = query.eq("is_public", true);

    const { data } = await query
      .order("created_at", { ascending: false })
      .limit(40);
    feedItems = (data || []).map((c) => ({ type: "card" as const, ...c }));
  } else if (tab === "saved") {
    const { data: saves } = await supabase
      .from("saves")
      .select("collection_id, stack_id")
      .eq("user_id", profileUser.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const ids =
      saves?.map((s) => s.collection_id || s.stack_id).filter(Boolean) || [];

    if (ids.length > 0) {
      let query = supabase
        .from("collections")
        .select(
          `
        id, title, description, cover_image_url, owner_id, stats,
        owner:users!collections_owner_id_fkey(username, display_name, avatar_url)
      `
        )
        .in("id", ids);

      if (!isOwnProfile)
        query = query.eq("is_public", true).eq("is_hidden", false);

      const { data } = await query;
      feedItems = (data || []).map((c) => ({
        type: "collection" as const,
        ...c,
        thumbnail_url: c.cover_image_url,
        creator: c.owner,
        domain: "Collection",
        canonical_url: `/collection/${c.id}`,
        upvotes_count: c.stats?.upvotes || 0,
        saves_count: c.stats?.saves || 0,
      }));
    }
  } else {
    // Default: Collections Created
    let query = supabase
      .from("collections")
      .select(
        `
      id, title, description, cover_image_url, owner_id, stats,
      owner:users!collections_owner_id_fkey(username, display_name, avatar_url)
    `
      )
      .eq("owner_id", profileUser.id);

    if (!isOwnProfile)
      query = query.eq("is_public", true).eq("is_hidden", false);

    const { data } = await query
      .order("created_at", { ascending: false })
      .limit(40);

    feedItems = (data || []).map((c) => ({
      type: "collection" as const,
      ...c,
      thumbnail_url: c.cover_image_url,
      creator: c.owner,
      domain: "Collection",
      canonical_url: `/collection/${c.id}`,
      upvotes_count: c.stats?.upvotes || 0,
      saves_count: c.stats?.saves || 0,
    }));
  }

  return (
    <div className="container mx-auto px-4 md:px-page py-6 md:py-12 pb-24 md:pb-8">
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

      {/* Tabs (Scrollable) */}
      <div className="border-b border-gray-light mb-6 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex gap-8 min-w-max">
          {[
            { id: "collection", label: "Collections" },
            { id: "card", label: "Cards" },
            { id: "saved", label: "Saved" },
          ].map((t) => (
            <a
              key={t.id}
              href={`/profile/${username}?tab=${t.id}`}
              className={`
                pb-3 px-1 border-b-2 transition-colors text-sm md:text-base font-medium whitespace-nowrap
                ${
                  tab === t.id ||
                  (tab === "created" && t.id === "collection") ||
                  (tab === "cards" && t.id === "card")
                    ? "border-emerald-600 text-jet-dark"
                    : "border-transparent text-gray-500 hover:text-jet-dark"
                }
              `}
            >
              {t.label}
            </a>
          ))}
        </div>
      </div>

      <ProfileFeedClient 
        items={feedItems} 
        tab={tab} 
        isOwnProfile={isOwnProfile} 
        userId={profile.id} 
      />
    </div>
  );
}
