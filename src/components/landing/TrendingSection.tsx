"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FeedGrid } from "@/components/feed/FeedGrid";

interface TrendingSectionProps {
  collections: any[];
  cards: any[];
}

export function TrendingSection({ collections, cards }: TrendingSectionProps) {
  const limitedCollections = collections.slice(0, 4);
  const limitedCards = cards.slice(0, 4);

  const trendingItems = [
    ...limitedCollections.map((c) => ({ type: "collection" as const, ...c })),
    ...limitedCards.map((c) => ({ type: "card" as const, ...c })),
  ];

  return (
    <section className="bg-white py-16 md:py-24 border-y border-gray-100">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trending Now
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            See what the community is curating and discussing this week.
          </p>
        </motion.div>

        {/* Categories Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <div className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 shadow-sm">
            🔥 Hot Collections
          </div>
          <div className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-600 shadow-sm">
            📈 Rising Cards
          </div>
        </div>

        {/* Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {trendingItems.length > 0 ? (
            <FeedGrid items={trendingItems} hideHoverButtons={true} />
          ) : (
            <div className="text-center py-12 text-gray-400">
              No trending items yet.
            </div>
          )}
        </motion.div>

        {/* CTA */}
        <div className="text-center mt-12 md:mt-16">
          <Link href="/explore">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto min-w-[200px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
            >
              Explore All Trending →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
