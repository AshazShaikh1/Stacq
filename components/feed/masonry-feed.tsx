"use client";

import { StacqCard } from "@/components/feed/stacq-card";
import { CompactStacqCard } from "@/components/feed/compact-stacq-card";
import Link from "next/link";
import { FeedItem } from "@/lib/types";

export default function MasonryFeed({ items }: { items: FeedItem[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="w-full">
      {/*
       * MOBILE (< sm): single-column compact list — no images, ≥2.5 cards visible
       * Shown only below sm breakpoint.
       */}
      <div className="sm:hidden flex flex-col gap-2.5">
        {items.map((item) => (
          <Link
            href={`/stacq/${item.slug || item.id}`}
            key={`mobile-${item.id}`}
            className="block outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
          >
            <CompactStacqCard item={item} />
          </Link>
        ))}
      </div>

      {/*
       * DESKTOP (≥ sm): CSS masonry grid with cover images
       * Hidden on mobile — zero layout cost.
       */}
      <div className="hidden sm:block">
        <div className="columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6">
          {items.map((item) => (
            <Link
              href={`/stacq/${item.slug || item.id}`}
              key={`desktop-${item.id}`}
              className="block break-inside-avoid mb-4 sm:mb-6 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
            >
              <StacqCard item={item} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
