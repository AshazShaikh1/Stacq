import { createClient } from '@/lib/supabase/server';
import { FeedGrid } from '@/components/feed/FeedGrid';
import { EmptyStacksState } from '@/components/ui/EmptyState';
import { redirect } from 'next/navigation';

export default async function MyStacksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's stacks
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
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching stacks:', error);
  }

  return (
    <div className="container mx-auto px-page py-section">
      <div className="mb-8">
        <h1 className="text-h1 font-bold text-jet-dark mb-2">Your Stacks</h1>
        <p className="text-body text-gray-muted">
          All your created stacks in one place
        </p>
      </div>

      {stacks && stacks.length > 0 ? (
        <FeedGrid stacks={stacks} />
      ) : (
        <EmptyStacksState />
      )}
    </div>
  );
}

