import { createClient } from "@/lib/supabase/server";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileFeedClient } from "@/components/profile/ProfileFeedClient";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getProfileByUsername } from "@/features/profiles/server/getProfileByUsername";
import { getProfileStats } from "@/features/profiles/server/getProfileStats";
import { getProfileFeed } from "@/features/profiles/server/getProfileFeed";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  
  const profileUser = await getProfileByUsername(username);

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
  const profileUser = await getProfileByUsername(username);

  if (!profileUser) notFound();

  const isOwnProfile = currentUser?.id === profileUser.id;

  // 2. Fetch Stats & Feed in Parallel
  const statsPromise = getProfileStats(profileUser.id);
  const feedPromise = getProfileFeed(profileUser.id, tab, isOwnProfile);

  const [stats, feedItems] = await Promise.all([statsPromise, feedPromise]);

  const profile = {
    ...profileUser,
    display_name: profileUser.display_name || "Unknown User",
    avatar_url: profileUser.avatar_url || undefined,
    stats,
  };

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
