import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { FeedItem, Resource } from "@/lib/types";

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop";

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/**
 * CompactStacqCard
 * ──────────────────────────────────────────────────────────────────────────────
 * Mobile-first card with a small square thumbnail on the left.
 * Designed so ≥2.5 cards are visible in a single viewport without scrolling.
 *
 * Layout:  [48×48 thumb] | title · resources · curator
 */
export function CompactStacqCard({ item }: { item: FeedItem }) {
  const title = item.title || "Untitled Stacq";
  const stacqItems = item.items || [];
  const username = item.stacqer?.username || "anonymous";
  const avatar = item.stacqer?.avatar || "";
  const displayName = item.stacqer?.display_name || username;
  const totalCount = stacqItems.length;

  const thumbnail =
    item.thumbnail || stacqItems[0]?.thumbnail || FALLBACK_THUMBNAIL;

  return (
    <div className="bg-background border border-border/60 rounded-xl p-3 flex gap-3 active:scale-[0.98] transition-transform">
      {/* Small square thumbnail */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
        <Image
          src={thumbnail}
          alt={title}
          fill
          sizes="56px"
          className="object-cover"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Title + count badge */}
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="font-bold text-sm leading-snug line-clamp-2 flex-1 text-foreground">
            {title}
          </h3>
          {totalCount > 0 && (
            <span className="shrink-0 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
              {totalCount}
            </span>
          )}
        </div>

        {/* Top 2 resources (compact — only 2 to keep overall height tight) */}
        <ul className="space-y-0.5">
          {stacqItems.slice(0, 2).map((listItem: Resource, i: number) => (
            <li key={i} className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <p className="text-xs text-muted-foreground line-clamp-1 min-w-0">
                <span className="font-semibold text-foreground">
                  {listItem.title}
                </span>
                {listItem.url && (
                  <span className="ml-1 text-primary/60 inline-flex items-center gap-0.5">
                    <ExternalLink className="w-2.5 h-2.5 shrink-0 inline" />
                    {getDomain(listItem.url)}
                  </span>
                )}
              </p>
            </li>
          ))}
          {stacqItems.length === 0 && (
            <li className="text-[10px] italic text-muted-foreground/50">
              No items yet.
            </li>
          )}
        </ul>

        {/* Curator */}
        <div className="flex items-center gap-1 mt-auto">
          <Avatar className="w-3.5 h-3.5 border shrink-0">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-[7px] font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-medium text-muted-foreground truncate">
            @{username}
          </span>
        </div>
      </div>
    </div>
  );
}
