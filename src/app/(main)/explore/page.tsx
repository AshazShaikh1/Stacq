import { FeedGrid } from '@/components/feed/FeedGrid';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; category?: string }>;
}) {
  const supabase = await createClient();
  const resolvedSearchParams = await searchParams;
  const sort = resolvedSearchParams.sort || 'trending';

  let stacks: any[] = [];
  let error: any = null;

  // Use explore_ranking materialized view for trending/default sort
  if (sort === 'trending' || sort === 'newest') {
    if (sort === 'trending') {
      // Use materialized view for trending (ranked by score)
      // First, get stack_ids from materialized view
      const { data: rankingData, error: rankingError } = await supabase
        .from('explore_ranking')
        .select('stack_id, score')
        .order('score', { ascending: false })
        .limit(40);

      if (!rankingError && rankingData && rankingData.length > 0) {
        // Extract stack IDs
        const stackIds = rankingData.map((item: any) => item.stack_id);
        
        // Fetch stacks with those IDs, maintaining order
        const { data: stacksData, error: stacksError } = await supabase
          .from('stacks')
          .select(`
            id,
            title,
            description,
            cover_image_url,
            owner_id,
            stats,
            owner:users!stacks_owner_id_fkey (
              username,
              display_name,
              avatar_url
            )
          `)
          .in('id', stackIds)
          .eq('is_public', true)
          .eq('is_hidden', false);

        if (!stacksError && stacksData) {
          // Maintain order from ranking
          const stacksMap = new Map(stacksData.map((s: any) => [s.id, s]));
          stacks = stackIds
            .map((id: string) => stacksMap.get(id))
            .filter(Boolean);
        } else {
          error = stacksError;
        }
      } else if (rankingError) {
        // If materialized view doesn't exist or is empty, fallback to direct query
        console.warn('Materialized view query failed, using fallback:', rankingError);
        const { data: stacksData, error: stacksError } = await supabase
          .from('stacks')
          .select(`
            id,
            title,
            description,
            cover_image_url,
            owner_id,
            stats,
            owner:users!stacks_owner_id_fkey (
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('is_public', true)
          .eq('is_hidden', false)
          .order('created_at', { ascending: false })
          .limit(40);

        if (!stacksError) {
          stacks = stacksData || [];
        } else {
          error = stacksError;
        }
      }
    } else {
      // Newest - fallback to direct query
      const { data: stacksData, error: stacksError } = await supabase
        .from('stacks')
        .select(`
          id,
          title,
          description,
          cover_image_url,
          owner_id,
          stats,
          owner:users!stacks_owner_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('is_public', true)
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(40);

      if (!stacksError) {
        stacks = stacksData || [];
      } else {
        error = stacksError;
      }
    }
  } else {
    // Upvoted - use direct query
    const { data: stacksData, error: stacksError } = await supabase
      .from('stacks')
      .select(`
        id,
        title,
        description,
        cover_image_url,
        owner_id,
        stats,
        owner:users!stacks_owner_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('is_public', true)
      .eq('is_hidden', false)
      .order('stats->upvotes', { ascending: false })
      .limit(40);

    if (!stacksError) {
      stacks = stacksData || [];
    } else {
      error = stacksError;
    }
  }

  if (error) {
    console.error('Error fetching stacks:', error);
  }

  return (
    <div className="container mx-auto px-page py-section">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-jet-dark mb-2">Explore</h1>
        <p className="text-body text-gray-muted mb-6">
          Discover trending stacks and top stackers
        </p>

        {/* Filters */}
        <div className="flex gap-3">
          <Link href="/explore?sort=trending">
            <Button
              variant={sort === 'trending' ? 'primary' : 'outline'}
              size="sm"
            >
              Trending
            </Button>
          </Link>
          <Link href="/explore?sort=newest">
            <Button
              variant={sort === 'newest' ? 'primary' : 'outline'}
              size="sm"
            >
              Newest
            </Button>
          </Link>
          <Link href="/explore?sort=upvoted">
            <Button
              variant={sort === 'upvoted' ? 'primary' : 'outline'}
              size="sm"
            >
              Most Upvoted
            </Button>
          </Link>
        </div>
      </div>

      <FeedGrid stacks={stacks || []} />
    </div>
  );
}

