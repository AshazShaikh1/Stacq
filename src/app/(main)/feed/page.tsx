import { FeedGrid } from '@/components/feed/FeedGrid';
import { createClient } from '@/lib/supabase/server';

export default async function FeedPage() {
  const supabase = await createClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // For now, show public stacks (later: personalized feed)
  const { data: stacks, error } = await supabase
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
    .limit(20);

  if (error) {
    console.error('Error fetching stacks:', error);
  }

  return (
    <div className="container mx-auto px-page py-section">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-jet-dark mb-2">Your Feed</h1>
        <p className="text-body text-gray-muted">
          Discover curated resources from the community
        </p>
      </div>

      <FeedGrid stacks={stacks || []} />
    </div>
  );
}

