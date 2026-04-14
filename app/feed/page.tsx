import MasonryFeed from "@/components/feed/masonry-feed";
import { createClient } from "@/lib/supabase/server";
import { PlusSquare } from "lucide-react";
import { Metadata } from "next";
import { Stacq, Profile, FeedItem } from "@/lib/types";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trending Community Stacqs | Discovery",
  description:
    "Explore the highest-signal resource collections shared by the Stacq community today.",
  alternates: {
    canonical: "https://stacq.in/feed",
  },
};

// ISR: Re-generate this page at most once every 60 seconds
export const revalidate = 60;

export default async function FeedPage() {
  const supabase = await createClient();

  let items: Stacq[] = [];
  let fetchError: unknown = null;

  try {
    // 1. Direct High-Signal Query (Avoiding the ambiguous trending_stacqs view)
    const { data: stacqs, error } = await supabase
      .from("stacqs")
      .select(
        `
                id, title, category, slug,
                profiles(username, avatar_url),
                resources(thumbnail)
            `,
      )
      // Sort by a combination of recently created and high signal
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) throw error;
    items = (stacqs as unknown as Stacq[]) || [];
  } catch (err) {
    console.error("Discovery Feed Error:", err);
    fetchError = err;
  }

  const formattedItems: FeedItem[] = items.map((s: Stacq) => {
    const coverImage =
      s.resources?.[0]?.thumbnail ||
      `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop`;
    const profiles = s.profiles as Profile | Profile[];
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;

    return {
      id: s.id,
      slug: s.slug || s.id, // fallback to id for old stacqs with null slug
      title: s.title,
      category: s.category,
      thumbnail: coverImage,
      items: s.resources || [],
      stacqer: {
        username: profile?.username || "anonymous",
        avatar: profile?.avatar_url,
      },
      remixCount: 0,
    };
  });

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 md:px-8 pb-24 sm:pb-20 md:pb-8">
        <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
              Discovery
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-semibold mt-1">
              Trending stacqs from the community.
            </p>
          </div>
        </div>

        {formattedItems.length > 0 ? (
          <MasonryFeed items={formattedItems} />
        ) : (
          <div
            data-testid="empty-feed-state"
            className="py-20 sm:py-32 text-center bg-background border-2 border-dashed border-border/50 rounded-4xl sm:rounded-[3rem] shadow-sm flex flex-col items-center justify-center px-4 sm:px-6"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 sm:mb-8 border border-primary/20 text-primary">
              <PlusSquare className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {fetchError ? "Signal Interrupted" : "No stacqs yet"}
            </h3>
            <p className="text-muted-foreground mt-3 font-medium max-w-sm text-sm sm:text-base leading-relaxed">
              {fetchError
                ? "We're having trouble connecting to the database. Try refreshing in a moment."
                : "Be the first to ship a high-signal stack to the community! Share your favorite resources today."}
            </p>
            {!fetchError && (
              <Link
                href="/stacq/new"
                className="mt-8 sm:mt-10 inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-8 sm:px-12 h-12 sm:h-14 text-sm sm:text-base font-black shadow-emerald shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                Create Your First Stacq
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
