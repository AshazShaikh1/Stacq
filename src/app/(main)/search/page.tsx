import { createClient } from "@/lib/supabase/server";
import { CollectionCard } from "@/components/collection/CollectionCard";
import { CardPreview } from "@/components/card/CardPreview";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StackGridSkeleton } from "@/components/ui/Skeleton";
import { EmptySearchState, EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { SearchIcon } from "lucide-react";
import { FeedGrid } from "@/components/feed/FeedGrid";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
}

export const metadata = {
  title: "Search - Stacq",
  description: "Search for collections and resources",
};

async function SearchResults({ query, type }: { query: string; type: string }) {
  if (!query || query.trim().length === 0) {
    return (
      <EmptyState
        icon="🔍"
        title="Start searching"
        description="Search for collections, cards, and creators"
      />
    );
  }

  const supabase = await createClient();
  const searchQuery = query.trim();

  // Build search results
  const results: {
    collections: any[];
    cards: any[];
    users: any[];
  } = {
    collections: [],
    cards: [],
    users: [],
  };

  // Search Collections (support legacy 'stacks' type)
  if (type === "all" || type === "stacks" || type === "collections") {
    // Use full-text search with search_vector
    const searchTerms = searchQuery
      .split(" ")
      .filter((t) => t.length > 0)
      .join(" & ");
    const { data: collections } = await supabase
      .from("collections")
      .select(
        `
        id,
        title,
        description,
        cover_image_url,
        owner_id,
        stats,
        slug,
        owner:users!collections_owner_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `
      )
      .eq("is_public", true)
      .eq("is_hidden", false)
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (collections) {
      // Filter by full-text search if search_vector is available
      const filtered = collections.filter((collection: any) => {
        const titleMatch = collection.title
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
        const descMatch = collection.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
        return titleMatch || descMatch;
      });
      results.collections = filtered;
    }
  }

  // Search Cards
  if (type === "all" || type === "cards") {
    const { data: cards } = await supabase
      .from("cards")
      .select(
        `
        id,
        title,
        description,
        thumbnail_url,
        canonical_url,
        domain
      `
      )
      .eq("status", "active")
      .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (cards) {
      results.cards = cards;
    }
  }

  // Search Users
  if (type === "all" || type === "users") {
    const { data: users } = await supabase
      .from("users")
      .select(
        `
        id,
        username,
        display_name,
        avatar_url
      `
      )
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .limit(20);

    if (users) {
      results.users = users;
    }
  }

  const totalResults =
    results.collections.length + results.cards.length + results.users.length;

  if (totalResults === 0) {
    return <EmptySearchState query={query} />;
  }

  return (
    <div className="space-y-8">
      {/* Results Summary */}
      <div className="text-body text-gray-muted">
        Found {totalResults} result{totalResults !== 1 ? "s" : ""} for &quot;
        {query}&quot;
      </div>

      {/* Collections Results */}
      {results.collections.length > 0 && (
        <div>
          <h2 className="text-h2 font-bold text-jet-dark mb-4">
            Collections ({results.collections.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.collections.map((collection: any) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </div>
      )}

      {/* Cards Results */}
      {results.cards.length > 0 && (
        <div>
          <h2 className="text-h2 font-bold text-jet-dark mb-4">
            Cards ({results.cards.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.cards.map((card: any) => (
              <CardPreview key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* Users Results */}
      {results.users.length > 0 && (
        <div>
          <h2 className="text-h2 font-bold text-jet-dark mb-4">
            Creators ({results.users.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {results.users.map((user: any) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="block"
              >
                <div className="p-4 bg-white rounded-lg border border-gray-light hover:border-jet transition-colors">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <Image
                        src={user.avatar_url}
                        alt={user.display_name}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-jet/20 flex items-center justify-center text-lg font-semibold text-jet">
                        {user.display_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-body font-semibold text-jet-dark truncate">
                        {user.display_name}
                      </div>
                      <div className="text-small text-gray-muted truncate">
                        @{user.username}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q || "";
  const supabase = await createClient();

  let items: any[] = [];

  if (query.trim().length > 0) {
    // 1. Search Collections (Title or Description)
    const { data: collections } = await supabase
      .from("collections")
      .select(
        `
        id, title, description, cover_image_url, owner_id, stats, created_at,
        owner:users!collections_owner_id_fkey (username, display_name, avatar_url)
      `
      )
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq("is_public", true)
      .eq("is_hidden", false)
      .limit(20);

    // 2. Search Cards (Title or Description)
    const { data: cards } = await supabase
      .from("cards")
      .select(
        `
        id, title, description, thumbnail_url, canonical_url, domain, 
        upvotes_count, saves_count, created_by, created_at,
        creator:users!cards_created_by_fkey (username, display_name, avatar_url)
      `
      )
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq("status", "active")
      .limit(20);

    // 3. Normalize & Merge
    const formattedCollections = (collections || []).map((c) => ({
      ...c,
      type: "collection" as const,
      thumbnail_url: c.cover_image_url,
      // Map stats for unified sorting
      upvotes_count: c.stats?.upvotes || 0,
    }));

    const formattedCards = (cards || []).map((c) => ({
      ...c,
      type: "card" as const,
    }));

    // Sort by relevance (here simply by upvotes as a proxy for quality)
    items = [...formattedCollections, ...formattedCards].sort(
      (a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0)
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Container: Responsive padding for Mobile (pb-24) & Desktop */}
      <div className="container mx-auto px-4 md:px-8 py-6 md:py-12 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-8">
          {/* Mobile-Only Search Input (Visible only on small screens) */}
          <div className="md:hidden mb-6">
            <form action="/search" method="get" className="relative">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search..."
                className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                autoFocus={!query}
              />
              <div className="absolute left-3 top-3.5 text-gray-400">
                <SearchIcon size={20} />
              </div>
            </form>
          </div>
          <h1 className="text-3xl font-bold text-jet-dark mb-2">
            {query ? `Results for "${query}"` : "Search"}
          </h1>
          <p className="text-gray-500">
            {items.length} {items.length === 1 ? "result" : "results"} found
          </p>
        </div>

        {/* Results Grid */}
        {items.length > 0 ? (
          <FeedGrid items={items} />
        ) : (
          <div className="mt-12">
            <EmptyState
              icon={<SearchIcon size={48} className="text-gray-300" />}
              title={query ? "No results found" : "Type to search"}
              description={
                query
                  ? "Try different keywords or check your spelling."
                  : "Find collections, resources, and stackers."
              }
              action={
                query
                  ? { label: "Explore Trending", href: "/explore" }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
