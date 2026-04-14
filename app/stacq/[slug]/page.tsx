import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { StacqBoard } from "@/components/stacq/stacq-board";
import { CollectionHeader } from "@/components/stacq/collection-header";
import dynamic from "next/dynamic";
import { Profile, Resource, Stacq } from "@/lib/types";

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

// ISR: Re-generate this page at most once every 60 seconds
export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: stacq } = await supabase
    .from("stacqs")
    .select(
      `
            title, description,
            profiles(display_name, username)
        `,
    )
    .ilike("slug", slug)
    .maybeSingle();

  if (!stacq) {
    return { title: "Not Found | Stacq" };
  }

  const profiles = stacq.profiles as unknown as Profile | Profile[];
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  const creatorName = profile?.display_name || profile?.username || "a Stacqer";

  const title = `${stacq.title} | Curated by ${creatorName} on Stacq`;
  const description =
    stacq.description && stacq.description.length > 0
      ? stacq.description.substring(0, 160)
      : "Explore this curated collection of high-signal resources on Stacq.";

  const ogUrl = new URL("https://stacq.in/api/og");
  ogUrl.searchParams.set("title", stacq.title);
  ogUrl.searchParams.set("username", profile?.username || "stacqer");

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

  const supabase = await createClient();

  // SEO REDIRECT: If the slug is a UUID, find the actual slug and redirect 301.
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      slug,
    );
  if (isUuid) {
    const { data: found } = await supabase
      .from("stacqs")
      .select("slug")
      .eq("id", slug)
      .single();

    if (found?.slug) {
      permanentRedirect(`/stacq/${found.slug}`);
    }
  }

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const STACQ_SELECT = `
        id, title, description, category, user_id, section_order,
        profiles(id, username, display_name, avatar_url),
        resources(id, title, url, thumbnail, note, section, order_index, user_id, stacq_id)
    `;

  // Primary lookup: by slug (works for all new stacqs)
  let { data: stacq, error } = await supabase
    .from("stacqs")
    .select(STACQ_SELECT)
    .ilike("slug", slug)
    .maybeSingle();

  // Fallback: by ID (covers old stacqs whose slug is null / not yet backfilled)
  if (!stacq && !error) {
    const { data: byId, error: idError } = await supabase
      .from("stacqs")
      .select(STACQ_SELECT)
      .eq("id", slug)
      .maybeSingle();
    if (byId) {
      stacq = byId;
      error = null;
      // Auto-backfill: generate and save slug so next visit uses the clean URL
      const { generateSlug } = await import("@/lib/actions/stacq");
      const newSlug = await generateSlug((byId as { title: string }).title);
      await supabase.from("stacqs").update({ slug: newSlug }).eq("id", slug);
    } else {
      error = idError;
    }
  }

  if (error) {
    return (
      <div className="p-6 sm:p-12 max-w-4xl mx-auto space-y-4 mt-12 bg-background rounded-2xl border-2 border-destructive/20 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-bold text-destructive">
          Database Error
        </h1>
        <div className="p-4 bg-destructive/5 text-foreground font-mono text-xs sm:text-sm rounded-lg border border-destructive/10 space-y-2 overflow-x-auto">
          <p>
            <strong>Message:</strong> {error.message}
          </p>
          <p>
            <strong>Code:</strong> {error.code}
          </p>
        </div>
      </div>
    );
  }

  if (!stacq) notFound();

  const castedStacq = stacq as unknown as Stacq;
  const profiles = castedStacq.profiles as Profile | Profile[];
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  const isOwner = currentUser?.id === castedStacq.user_id;

  const resources = castedStacq.resources || [];

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
              Stacqer
            </p>
          </div>
        </Link>

        {/* Action buttons — rendered directly (no Suspense on server async fn) */}
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

      {/* Resource Board — key changes on ANY resource add/delete/section-change,
                forcing a remount so StacqBoard picks up fresh server data immediately */}
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
