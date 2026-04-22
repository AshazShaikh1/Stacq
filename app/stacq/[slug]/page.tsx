import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { StacqBoard } from "@/components/stacq/stacq-board";
import { CollectionHeader } from "@/components/stacq/collection-header";
import dynamic from "next/dynamic";
import { Profile, Resource, Stacq } from "@/lib/types";
import { fetchStacqBySlug, fetchStacqMetaBySlug } from "@/lib/queries";

// Dynamic imports — client-only components
const ShareButton = dynamic(() =>
  import("@/components/stacq/share-button").then((mod) => mod.ShareButton),
);
const SaveButton = dynamic(() =>
  import("@/components/stacq/save-button").then((mod) => mod.SaveButton),
);
const FollowButton = dynamic(() =>
  import("@/components/profile/follow-button").then((mod) => mod.FollowButton),
);
const AddResourceDialog = dynamic(() =>
  import("@/components/stacq/add-resource-dialog").then(
    (mod) => mod.AddResourceDialog,
  ),
);
const StacqConversionBanner = dynamic(() =>
  import("@/components/stacq/stacq-conversion-banner").then(
    (mod) => mod.StacqConversionBanner,
  ),
);

// ISR: Re-generate this page at most once every 60 seconds
export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  _parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;

  // ✅ Uses shared cached fetch — no extra DB call if page body already fetched this
  const stacq = await fetchStacqMetaBySlug(slug);

  if (!stacq) {
    return { title: "Not Found | Stacq" };
  }

  const profiles = stacq.profiles as unknown as Profile | Profile[];
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  const creatorName = profile?.display_name || profile?.username || "a curator";

  const title = `${stacq.title} | Curated by ${creatorName} on Stacq`;
  const description =
    stacq.description && stacq.description.length > 0
      ? stacq.description.substring(0, 160)
      : "Explore this curated collection of resources on Stacq.";

  const ogUrl = new URL("https://stacq.in/api/og");
  ogUrl.searchParams.set("title", stacq.title);
  ogUrl.searchParams.set("username", profile?.username || "curator");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `https://stacq.in/stacq/${slug}`,
      images: [ogUrl.toString()],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl.toString()],
    },
    alternates: {
      canonical: `https://stacq.in/stacq/${slug}`,
    },
  };
}

export default async function StacqDetailPage({ params }: Props) {
  const { slug } = await params;

  if (!slug || slug === "undefined" || slug === "null") {
    notFound();
  }

  // SEO REDIRECT: If slug is a UUID, find the actual slug and redirect 301.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slug,
    );
  if (isUuid) {
    const supabase = await createClient();
    const { data: found } = await supabase
      .from("stacqs")
      .select("slug")
      .eq("id", slug)
      .single();
    if (found?.slug) {
      permanentRedirect(`/stacq/${found.slug}`);
    }
  }

  // ─── Parallel: auth check + main content fetch ────────────────────────────
  // fetchStacqBySlug is cached — this is the same request as generateMetadata,
  // so it returns from the in-process cache (0 extra DB calls).
  const supabase = await createClient();

  const [stacqResult, authResult] = await Promise.all([
    fetchStacqBySlug(slug),
    supabase.auth.getUser(),
  ]);

  const stacq = stacqResult;
  const currentUser = authResult.data.user;

  if (!stacq) {
    notFound();
  }

  const castedStacq = stacq as unknown as Stacq;
  const profiles = castedStacq.profiles as Profile | Profile[];
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  const isOwner = currentUser?.id === castedStacq.user_id;
  const resources = castedStacq.resources || [];

  // ─── Parallel: user-specific relationship checks ──────────────────────────
  // Only fires for logged-in non-owners; skipped entirely for public visitors.
  const [followResult, saveResult] = await Promise.all([
    currentUser && !isOwner
      ? supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentUser.id)
          .eq("following_id", castedStacq.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    currentUser && !isOwner
      ? supabase
          .from("saved_collections")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("stacq_id", castedStacq.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isFollowingCreator = !!followResult.data;
  const isSaved = !!saveResult.data;

  // Build ordered sections list
  const derivedSections = new Set<string>(castedStacq.section_order || []);
  resources.forEach((r) => {
    if (r.section) derivedSections.add(r.section);
  });
  if (derivedSections.size === 0) {
    derivedSections.add("Default");
  }
  const sections = Array.from(derivedSections);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: castedStacq.title,
    description: castedStacq.description,
    url: `https://stacq.in/stacq/${slug}`,
    author: {
      "@type": "Person",
      name: profile?.display_name || profile?.username,
      url: `https://stacq.in/${profile?.username}`,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: resources.length,
      itemListElement: resources.map((resource: Resource, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "WebPage",
          name: resource.title,
          url: resource.url,
          description: resource.note,
          image: resource.thumbnail,
        },
      })),
    },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-4 pb-32 md:pb-20 space-y-6 sm:space-y-8 min-h-dvh overflow-x-hidden w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Conversion banner: contextualises the platform for cold visitors */}
      <StacqConversionBanner />
      <CollectionHeader stacq={castedStacq} isOwner={isOwner} />

      {/* Creator row + Action buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-5 border-y border-border gap-6 sm:gap-4">
        <Link
          href={`/${profile?.username}`}
          className="flex items-center gap-3 sm:gap-4 group cursor-pointer w-full sm:w-auto"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold border-2 border-background shadow-sm shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
            {profile?.avatar_url ? (
              <div className="relative w-full h-full">
                <Image
                  src={profile.avatar_url}
                  alt={profile.username || "avatar"}
                  fill
                  sizes="(max-width: 640px) 40px, 48px"
                  className="object-cover"
                  priority
                  unoptimized={
                    profile.avatar_url.includes(".svg") ||
                    profile.avatar_url.includes("dicebear")
                  }
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            ) : (
              profile?.username?.substring(0, 1).toUpperCase()
            )}
          </div>
          <div className="flex flex-col">
            <p className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-tight">
              @{profile?.username}
            </p>
            <p className="text-[9px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
              Curator
            </p>
          </div>
        </Link>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-none min-w-fit">
            <ShareButton title={castedStacq.title} stacqId={slug} />
            {!isOwner && (
              <SaveButton stacqId={castedStacq.id} isInitiallySaved={isSaved} />
            )}
          </div>

          {!isOwner && profile?.id && (
            <div className="flex-1 sm:flex-none min-w-[120px]">
              <FollowButton
                targetUserId={profile.id}
                isInitiallyFollowing={isFollowingCreator}
              />
            </div>
          )}

          {isOwner && (
            <AddResourceDialog
              stacqId={castedStacq.id}
              availableSections={sections}
            />
          )}
        </div>
      </div>

      {/* Resource Board */}
      {(() => {
        const boardKey = (castedStacq.resources || [])
          .map(
            (r: { id: string; section: string | null }) =>
              `${r.id}:${r.section ?? ""}`,
          )
          .sort()
          .join("|");
        return (
          <div className="pt-2">
            <StacqBoard
              key={boardKey}
              initialStacq={castedStacq}
              isOwner={isOwner}
            />
          </div>
        );
      })()}
    </div>
  );
}
