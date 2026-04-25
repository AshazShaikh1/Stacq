import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MasonryFeed from "@/components/feed/masonry-feed";
import { CreateStacqModal } from "@/components/stacq/create-stacq-modal";
import { PlusSquare, Compass } from "lucide-react";
import { ProfileHeaderClient } from "@/components/profile/profile-header-client";
import { Stacq, Profile, FeedItem } from "@/lib/types";
import { Metadata, ResolvingMetadata } from "next";
import {
  fetchProfileByUsername,
  fetchProfileMetaByUsername,
  fetchStacqsByUserId,
} from "@/lib/queries";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { username } = await params;

  // ✅ Cached fetch — no extra DB call when page body also calls fetchProfileByUsername
  const profile = await fetchProfileMetaByUsername(username);

  if (!profile) {
    return { title: "User Not Found | Stacq" };
  }

  const name = profile.display_name || profile.username;
  const title = `${name} (@${profile.username}) | Stacq`;
  const description =
    profile.bio ||
    `Browse ${name}'s curated resource lists on Stacq — tools, articles, and links handpicked by a practitioner.`;

  const canonicalUrl = `https://stacq.in/${username}`;

  // Dynamic OG image via the existing /api/og route
  const ogUrl = new URL("https://stacq.in/api/og");
  ogUrl.searchParams.set("title", `${name}’s Resource Lists`);
  ogUrl.searchParams.set("username", username);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "profile",
      url: canonicalUrl,
      title,
      description,
      siteName: "Stacq",
      images: [{ url: ogUrl.toString(), width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl.toString()],
    },
  };
}

// ISR: 60s
export const revalidate = 60;

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // ─── Step 1: Fetch profile (cached — shared with generateMetadata) ────────
  const profile = await fetchProfileByUsername(username);
  if (!profile) notFound();

  // ─── Step 2: Parallel — auth + stacqs feed (don't block each other) ──────
  const supabase = await createClient();

  const [authResult, stacqs] = await Promise.all([
    supabase.auth.getUser(),
    fetchStacqsByUserId(profile.id), // cached per user_id
  ]);

  const currentUser = authResult.data.user;
  const isOwnProfile = currentUser?.id === profile.id;

  // ─── Step 3: Conditional follow check (only for logged-in visitors) ───────
  // Runs after auth is resolved; skipped entirely for anonymous traffic.
  let isFollowing = false;
  if (currentUser && !isOwnProfile) {
    const { data: followRecord } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = !!followRecord;
  }

  // ─── Derived counts ───────────────────────────────────────────────────────
  // Use denormalized followers_count from the profile row (kept in sync by DB trigger).
  // Falls back to 0 if the trigger hasn't run yet.
  const followersCount = profile.followers_count ?? 0;

  // Owners see all their stacqs (public + private).
  // Visitors only see public stacqs.
  const visibleStacqs = isOwnProfile
    ? stacqs
    : (stacqs as unknown as Stacq[]).filter((s) => s.is_public ?? true);

  const collectionCount = visibleStacqs.length;
  const resourceCount = ((visibleStacqs as unknown as Stacq[]) || []).reduce(
    (acc: number, stacq: Stacq) => acc + (stacq.resources?.length || 0),
    0,
  );

  // ─── Format for MasonryFeed ───────────────────────────────────────────────
  const formattedItems: FeedItem[] = (
    (visibleStacqs as unknown as Stacq[]) || []
  ).map((s, idx) => {
    const profiles = s.profiles as Profile | Profile[];
    const profileData = Array.isArray(profiles) ? profiles[0] : profiles;

    return {
      id: s.id,
      slug: s.slug || s.id,
      title: s.title,
      category: s.category,
      aspectRatio: (() => {
        const ratios = [
          "aspect-square",
          "aspect-[4/5]",
          "aspect-[3/4]",
          "aspect-[2/3]",
        ];
        return ratios[idx % ratios.length];
      })(),
      thumbnail: s.resources?.[0]?.thumbnail,
      items: s.resources || [],
      stacqer: {
        username: profileData?.username || "anonymous",
        avatar: profileData?.avatar_url,
      },
      remixCount: 0,
    };
  });

  return (
    <div className="min-h-screen bg-surface pb-24 sm:pb-20">
      {/* ProfilePage JSON-LD — Google uses this for author/person knowledge panels */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            url: `https://stacq.in/${profile.username}`,
            mainEntity: {
              "@type": "Person",
              name: profile.display_name || profile.username,
              identifier: `@${profile.username}`,
              description:
                profile.bio ||
                `Curator on Stacq — curated resource lists for practitioners.`,
              url: `https://stacq.in/${profile.username}`,
              image: profile.avatar_url || undefined,
            },
          }),
        }}
      />
      {/* Header */}
      <ProfileHeaderClient
        profile={profile}
        isOwnProfile={isOwnProfile}
        initialIsFollowing={isFollowing}
        initialFollowersCount={followersCount}
        stacqCount={collectionCount}
        resourceCount={resourceCount}
      />

      {/* Masonry Feed */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 md:py-16">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-6 sm:mb-8 text-foreground">
          Resource Lists
        </h2>

        {formattedItems.length > 0 ? (
          <MasonryFeed items={formattedItems} />
        ) : (
          <div className="flex flex-col items-center justify-center p-10 sm:p-12 md:p-24 bg-background rounded-2xl sm:rounded-3xl border-2 border-dashed border-border shadow-sm mt-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 border border-primary/20">
              <Compass className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-foreground mb-3 tracking-tight">
              No lists yet
            </h3>

            <p className="text-muted-foreground text-center max-w-md mb-6 sm:mb-8 text-sm sm:text-lg leading-relaxed">
              {isOwnProfile
                ? "You haven't started curating yet. Build your first list to compile and share your favorite resources!"
                : "This curator hasn't published any resource lists yet. Check back soon."}
            </p>

            {isOwnProfile && (
              <CreateStacqModal>
                <button className="inline-flex items-center justify-center whitespace-nowrap text-sm sm:text-base bg-primary hover:bg-primary-dark text-white rounded-full px-6 sm:px-8 h-12 sm:h-14 font-bold shadow-emerald shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 outline-none border-none">
                  <PlusSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                  Start Curating
                </button>
              </CreateStacqModal>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
