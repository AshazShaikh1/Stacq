import { createClient } from '@/lib/supabase/server';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { FeedGrid } from '@/components/feed/FeedGrid';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;
  const supabase = await createClient();
  
  const { data: profileUser } = await supabase
    .from('users')
    .select('display_name, avatar_url')
    .eq('username', username)
    .single();
  
  if (!profileUser) {
    return generateSEOMetadata({
      title: 'Profile Not Found',
      description: 'The profile you are looking for does not exist',
    });
  }
  
  return generateSEOMetadata({
    title: `${profileUser.display_name} (@${username})`,
    description: `View ${profileUser.display_name}'s profile on Stacq`,
    image: profileUser.avatar_url || undefined,
    url: `/profile/${username}`,
  });
}

export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { username } = await params;
  const { tab: tabParam } = await searchParams;
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const tab = tabParam || 'collection';

  // Get profile user
  const { data: profileUser, error: profileError } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url')
    .eq('username', username)
    .single();

  if (profileError || !profileUser) {
    notFound();
  }

  const isOwnProfile = currentUser?.id === profileUser.id;

  // Get stats
  const [createdCount, savedCount, upvotesResult, viewsResult, followerCount, followingCount] = await Promise.all([
    supabase
      .from('collections')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', profileUser.id),
    supabase
      .from('saves')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profileUser.id),
    supabase
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profileUser.id),
    supabase
      .from('collections')
      .select('stats', { count: 'exact' })
      .eq('owner_id', profileUser.id),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profileUser.id),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', profileUser.id),
  ]);

  const totalViews = viewsResult.data?.reduce((sum, collection) => {
    return sum + ((collection.stats as any)?.views || 0);
  }, 0) || 0;

  const profile = {
    ...profileUser,
    stats: {
      collections_created: createdCount.count || 0,
      collections_saved: savedCount.count || 0,
      total_upvotes: upvotesResult.count || 0,
      total_views: totalViews,
      followers: followerCount.count || 0,
      following: followingCount.count || 0,
    },
  };

  // Get collections or cards based on tab
  let collections: any[] = [];
  let cards: any[] = [];
  let collectionsError: any = null;
  let cardsError: any = null;

  if (tab === 'card' || tab === 'cards') { // Support both 'card' and 'cards'
    // Fetch cards created by the user
    let cardsQuery = supabase
      .from('cards')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        canonical_url,
        domain,
        created_at,
        created_by,
        is_public,
        visits_count,
        saves_count,
        upvotes_count,
        comments_count,
        creator:users!cards_created_by_fkey (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('created_by', profileUser.id)
      .eq('status', 'active');

    if (!isOwnProfile) {
      cardsQuery = cardsQuery.eq('is_public', true);
    }

    const result = await cardsQuery
      .order('created_at', { ascending: false })
      .limit(40);

    cards = result.data || [];
    cardsError = result.error;
  } else {
    // Fetch collections
    let collectionsQuery = supabase
      .from('collections')
      .select(`
        id,
        title,
        description,
        cover_image_url,
        owner_id,
        stats,
        owner:users!collections_owner_id_fkey (
          username,
          display_name,
          avatar_url
        )
      `);

    if (tab === 'collection' || tab === 'created') { // Support both 'collection' and legacy 'created'
      collectionsQuery = collectionsQuery.eq('owner_id', profileUser.id);
      if (!isOwnProfile) {
        collectionsQuery = collectionsQuery.eq('is_public', true).eq('is_hidden', false);
      }
    } else if (tab === 'saved') {
      // Get saved collections from saves table (support both collection_id and stack_id)
      const { data: saves } = await supabase
        .from('saves')
        .select('collection_id, stack_id')
        .eq('user_id', profileUser.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (saves && saves.length > 0) {
        const collectionIds = saves
          .map(s => s.collection_id || s.stack_id)
          .filter((id): id is string => !!id);
        collectionsQuery = collectionsQuery.in('id', collectionIds);
        if (!isOwnProfile) {
          collectionsQuery = collectionsQuery.eq('is_public', true).eq('is_hidden', false);
        }
      } else {
        collectionsQuery = collectionsQuery.eq('id', '00000000-0000-0000-0000-000000000000'); // Return no results
      }
    }

    const result = await collectionsQuery
      .order('created_at', { ascending: false })
      .limit(40);

    collections = result.data || [];
    collectionsError = result.error;
  }

  if (collectionsError) {
    console.error('Error fetching collections:', collectionsError);
  }
  if (cardsError) {
    console.error('Error fetching cards:', cardsError);
  }

  // Combine collections and cards into feed items format
  const feedItems = [
    ...collections.map(c => ({ type: 'collection' as const, ...c })),
    ...cards.map(c => ({ type: 'card' as const, ...c }))
  ];

  return (
    <div className="container mx-auto px-page py-section">
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} />

      {/* Tabs */}
      <div className="border-b border-gray-light mb-6">
        <div className="flex gap-8">
          <a
            href={`/profile/${username}?tab=collection`}
            className={`
              pb-4 px-1 border-b-2 transition-colors
              ${tab === 'collection' || tab === 'created'
                ? 'border-jet text-jet-dark font-semibold'
                : 'border-transparent text-gray-muted hover:text-jet-dark'
              }
            `}
          >
            Collection
          </a>
          <a
            href={`/profile/${username}?tab=card`}
            className={`
              pb-4 px-1 border-b-2 transition-colors
              ${tab === 'card' || tab === 'cards'
                ? 'border-jet text-jet-dark font-semibold'
                : 'border-transparent text-gray-muted hover:text-jet-dark'
              }
            `}
          >
            Card
          </a>
          <a
            href={`/profile/${username}?tab=saved`}
            className={`
              pb-4 px-1 border-b-2 transition-colors
              ${tab === 'saved'
                ? 'border-jet text-jet-dark font-semibold'
                : 'border-transparent text-gray-muted hover:text-jet-dark'
              }
            `}
          >
            Saved
          </a>
        </div>
      </div>

      {/* Collections/Cards Grid */}
      <FeedGrid items={feedItems} />
    </div>
  );
}

