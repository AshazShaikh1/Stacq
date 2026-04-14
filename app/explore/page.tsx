import { createClient } from "@/lib/supabase/server";
import MasonryFeed from "@/components/feed/masonry-feed";
import { Search, Compass } from "lucide-react";
import { Metadata } from "next";
import { Stacq, FeedItem, Profile } from "@/lib/types";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explore Curated Collections | Stacq",
  description:
    "Discover high-signal collections of resources curated by the community. Search for frontend, design, productivity, and more.",
  alternates: {
    canonical: "https://stacq.in/explore",
  },
};

// ISR: 60s
export const revalidate = 60;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let items: Stacq[] = [];
  let fetchError: unknown = null;

  try {
    // 1. Fetch search results with joined profile/resource data
    const { data: results, error } = await supabase
      .from("stacqs")
      .select(
        `
                id,
                slug,
                title,
                category,
                thumbnail,
                profiles(username, avatar_url),
                resources(title, thumbnail)
            `,
      )
      .ilike("title", `%${q || ""}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    items = (results as unknown as Stacq[]) || [];
  } catch (err) {
    console.error("Explore Search Error:", err);
    fetchError = err;
  }

  // 2. Format results for MasonryFeed compatibility
  const ASPECT_RATIOS = [
    "aspect-square",
    "aspect-video",
    "aspect-[4/5]",
    "aspect-[3/4]",
  ];
  const formattedResults: FeedItem[] = items.map((s) => {
    const ratioIndex = s.id.charCodeAt(0) % ASPECT_RATIOS.length;
    const profiles = s.profiles as Profile | Profile[];
    const profile = Array.isArray(profiles) ? profiles[0] : profiles;

    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      category: s.category,
      aspectRatio: ASPECT_RATIOS[ratioIndex],
      thumbnail: s.thumbnail || s.resources?.[0]?.thumbnail,
      items: s.resources || [],
      stacqer: {
        username: profile?.username || "anonymous",
        avatar: profile?.avatar_url,
      },
      remixCount: 0,
    };
  });

  return (
    <section className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto p-6 md:p-8 pb-24 md:pb-8">
        <div className="mb-10">
          <div className="flex items-center gap-3 text-primary mb-3">
            <Compass className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">
              Global Search
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
            {q ? (
              <>
                Results for{" "}
                <span className="text-primary">&quot;{q}&quot;</span>
              </>
            ) : (
              "Explore All Collections"
            )}
          </h1>
          <p className="text-muted-foreground mt-2 font-bold text-sm md:text-base">
            {fetchError
              ? "Database signal lost. Showing maintenance state."
              : `Found ${formattedResults.length} high-signal collections matching your interests.`}
          </p>
        </div>

        {formattedResults.length > 0 ? (
          <MasonryFeed items={formattedResults} />
        ) : (
          <div
            data-testid="empty-explore-state"
            className="py-32 text-center bg-background border-2 border-dashed border-border/50 rounded-[3rem] shadow-sm flex flex-col items-center justify-center px-6 mx-2"
          >
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-8 border border-border">
              <Search className="w-10 h-10 text-primary/20" />
            </div>
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              {fetchError ? "Discovery Offline" : "No collections found"}
            </h3>
            <p className="text-muted-foreground mt-3 font-medium max-w-sm text-base leading-relaxed">
              {fetchError
                ? "We're having trouble retrieving collections right now. Please check back in a moment."
                : "We couldn't find any results for that search. Try another keyword or explore trending collections."}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full justify-center">
              <Link
                href="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-12 h-14 text-base font-black shadow-emerald shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                Clear Search
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-background border border-border hover:bg-surface text-foreground rounded-full px-12 h-14 text-base font-bold transition-all active:scale-95"
              >
                Go Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
