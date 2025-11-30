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
  const sort = resolvedSearchParams.sort || 'newest';

  let query = supabase
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
    .eq('is_hidden', false);

  // Apply sorting
  if (sort === 'upvoted') {
    query = query.order('stats->upvotes', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data: stacks, error } = await query.limit(40);

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

