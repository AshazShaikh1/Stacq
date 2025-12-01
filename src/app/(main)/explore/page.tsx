import { FeedGrid } from '@/components/feed/FeedGrid';
import { EmptyState } from '@/components/ui/EmptyState';
import { createClient } from '@/lib/supabase/server';

export default async function ExplorePage() {
  const supabase = await createClient();

  // Calculate date ranges
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  // Fetch today's trending
  const { data: todayStacks, error: todayError } = await supabase
    .from('stacks')
    .select(`
      id,
      title,
      description,
      cover_image_url,
      owner_id,
      stats,
      created_at,
      owner:users!stacks_owner_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      tags:stack_tags (
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

  if (todayError) {
    console.error('Error fetching today stacks:', todayError);
  }

  // Fetch last week's trending
  const { data: weekStacks, error: weekError } = await supabase
    .from('stacks')
    .select(`
      id,
      title,
      description,
      cover_image_url,
      owner_id,
      stats,
      created_at,
      owner:users!stacks_owner_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      tags:stack_tags (
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

  if (weekError) {
    console.error('Error fetching week stacks:', weekError);
  }

  // Fetch this month's trending
  const { data: monthStacks, error: monthError } = await supabase
    .from('stacks')
    .select(`
      id,
      title,
      description,
      cover_image_url,
      owner_id,
      stats,
      created_at,
      owner:users!stacks_owner_id_fkey (
        username,
        display_name,
        avatar_url
      ),
      tags:stack_tags (
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

  if (monthError) {
    console.error('Error fetching month stacks:', monthError);
  }

  // Sort by upvotes
  const sortByUpvotes = (stacks: any[]) => {
    return [...(stacks || [])].sort((a: any, b: any) => {
      const aUpvotes = a.stats?.upvotes || 0;
      const bUpvotes = b.stats?.upvotes || 0;
      return bUpvotes - aUpvotes;
    });
  };

  const sortedTodayStacks = sortByUpvotes(todayStacks || []);
  const sortedWeekStacks = sortByUpvotes(weekStacks || []);
  const sortedMonthStacks = sortByUpvotes(monthStacks || []);

  return (
    <div className="container mx-auto px-page py-section">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-jet-dark mb-2">Explore</h1>
        <p className="text-body text-gray-muted mb-6">
          Discover trending stacks and top stackers
        </p>
      </div>

      {/* Today Trending */}
      {sortedTodayStacks.length > 0 && (
        <div className="mb-12">
          <h2 className="text-h2 font-semibold text-jet-dark mb-6">Today Trending</h2>
          <FeedGrid stacks={sortedTodayStacks} />
        </div>
      )}

      {/* Last Week Trending */}
      {sortedWeekStacks.length > 0 && (
        <div className="mb-12">
          <h2 className="text-h2 font-semibold text-jet-dark mb-6">Last Week Trending</h2>
          <FeedGrid stacks={sortedWeekStacks} />
        </div>
      )}

      {/* This Month Trending */}
      {sortedMonthStacks.length > 0 && (
        <div className="mb-12">
          <h2 className="text-h2 font-semibold text-jet-dark mb-6">This Month Trending</h2>
          <FeedGrid stacks={sortedMonthStacks} />
        </div>
      )}

      {/* Show message if no stacks */}
      {sortedTodayStacks.length === 0 && sortedWeekStacks.length === 0 && sortedMonthStacks.length === 0 && (
        <EmptyState
          icon="📊"
          title="No trending stacks yet"
          description="Be the first to create a stack and share it with the community"
          action={{
            label: "Create Stack",
            href: "/",
          }}
        />
      )}
    </div>
  );
}
