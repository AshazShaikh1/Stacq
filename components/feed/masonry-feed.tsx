"use client"

import { StacqCard } from "@/components/feed/stacq-card"
import Link from "next/link"

export default function MasonryFeed({ items }: { items: any[] }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="w-full">
            {/* Responsive CSS Columns: 1 col on mobile, 2 on sm, 3 on lg */}
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-6">
                {items.map((item) => (
                    <Link 
                        href={`/stacq/${item.slug || item.id}`} 
                        key={item.id} 
                        className="block break-inside-avoid mb-4 sm:mb-6 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                    >
                        <StacqCard item={item} />
                    </Link>
                ))}
            </div>
        </div>
    )
}