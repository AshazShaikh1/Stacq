import { FeedGrid } from '@/components/feed/FeedGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';
import { cached } from '@/lib/redis';
import { getCacheKey, CACHE_TTL } from '@/lib/cache/supabase-cache';

export default async function ExplorePage() {
  const supabase = await createClient();

  // Calculate date ranges
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Fetch today's trending with caching
  const todayResult = await cached(
    getCacheKey('collections', { 
      is_public: true, 
      is_hidden: false,
      created_at_gte: today.toISOString()
    }, { 
      order: 'created_at DESC',
      limit: 20 
    }),
    async () => {
      return await supabase
        .from('collections')
        .select(`
          id,
          title,
          description,
          cover_image_url,
          owner_id,
          stats,
          created_at,
          owner:users!collections_owner_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          tags:collection_tags (
            tag:tags (
              id,
              name
            )
          )
        `)
        .eq('is_public', true)
        .eq('is_hidden', false)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
    },
    CACHE_TTL.EXPLORE
  );
  const { data: todayCollections, error: todayError } = todayResult;

  if (todayError) {
    console.error('Error fetching today collections:', todayError);
  }

  // Fetch last week's trending with caching
  const weekResult = await cached(
    getCacheKey('collections', { 
      is_public: true, 
      is_hidden: false,
      created_at_gte: weekAgo.toISOString(),
      created_at_lt: today.toISOString()
    }, { 
      order: 'created_at DESC',
      limit: 20 
    }),
    async () => {
      return await supabase
        .from('collections')
        .select(`
          id,
          title,
          description,
          cover_image_url,
          owner_id,
          stats,
          created_at,
          owner:users!collections_owner_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          tags:collection_tags (
            tag:tags (
              id,
              name
            )
          )
        `)
        .eq('is_public', true)
        .eq('is_hidden', false)
        .gte('created_at', weekAgo.toISOString())
        .lt('created_at', today.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
    },
    CACHE_TTL.EXPLORE
  );
  const { data: weekCollections, error: weekError } = weekResult;

  // Fetch this month's trending with caching
  const monthResult = await cached(
    getCacheKey('collections', { 
      is_public: true, 
      is_hidden: false,
      created_at_gte: monthAgo.toISOString(),
      created_at_lt: weekAgo.toISOString()
    }, { 
      order: 'created_at DESC',
      limit: 20 
    }),
    async () => {
      return await supabase
        .from('collections')
        .select(`
          id,
          title,
          description,
          cover_image_url,
          owner_id,
          stats,
          created_at,
          owner:users!collections_owner_id_fkey (
            username,
            display_name,
            avatar_url
          ),
          tags:collection_tags (
            tag:tags (
              id,
              name
            )
          )
        `)
        .eq('is_public', true)
        .eq('is_hidden', false)
        .gte('created_at', monthAgo.toISOString())
        .lt('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20);
    },
    CACHE_TTL.EXPLORE
  );
  const { data: monthCollections, error: monthError } = monthResult;

  if (monthError) {
    console.error('Error fetching month collections:', monthError);
  }

  // Sort by upvotes
  const sortByUpvotes = (collections: any[]) => {
    return [...(collections || [])].sort((a: any, b: any) => {
      const aUpvotes = a.stats?.upvotes || 0;
      const bUpvotes = b.stats?.upvotes || 0;
      return bUpvotes - aUpvotes;
    });
  };

  const sortedTodayCollections = sortByUpvotes(todayCollections || []);
  const sortedWeekCollections = sortByUpvotes(weekCollections || []);
  const sortedMonthCollections = sortByUpvotes(monthCollections || []);

  return (
    <div className="container mx-auto px-page py-section">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-jet-dark mb-2">Explore</h1>
        <p className="text-body text-gray-muted mb-6">
          Discover trending collections and top creators
        </p>
      </div>

      {/* Today Trending */}
      {sortedTodayCollections.length > 0 && (
        <div className="mb-12">
          <h2 className="text-h2 font-semibold text-jet-dark mb-6">Today Trending</h2>
          <FeedGrid collections={sortedTodayCollections} />
        </div>
      )}

      {/* Last Week Trending */}
      {sortedWeekCollections.length > 0 && (
        <div className="mb-12">
          <h2 className="text-h2 font-semibold text-jet-dark mb-6">Last Week Trending</h2>
          <FeedGrid collections={sortedWeekCollections} />
        </div>
      )}

      {/* This Month Trending */}
      {sortedMonthCollections.length > 0 && (
        <div className="mb-12">
          <h2 className="text-h2 font-semibold text-jet-dark mb-6">This Month Trending</h2>
          <FeedGrid collections={sortedMonthCollections} />
        </div>
      )}

      {/* Show message if no collections */}
      {sortedTodayCollections.length === 0 && sortedWeekCollections.length === 0 && sortedMonthCollections.length === 0 && (
        <EmptyState
          icon="📊"
          title="No trending collections yet"
          description="Be the first to create a collection and share it with the community"
          action={{
            label: "Create Collection",
            href: "/",
          }}
        />
      )}
    </div>
  );
}
