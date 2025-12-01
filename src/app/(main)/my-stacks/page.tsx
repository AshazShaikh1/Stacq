import { createClient } from '@/lib/supabase/server';
import { FeedGrid } from '@/components/feed/FeedGrid';
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
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-h2 font-semibold text-jet-dark mb-2">No stacks yet</h2>
          <p className="text-body text-gray-muted mb-6">
            Create your first stack to get started
          </p>
          <a href="/create" className="inline-block">
            <button className="px-6 py-3 bg-jet text-white rounded-md hover:opacity-90 transition-opacity">
              Create Stack
            </button>
          </a>
        </div>
      )}
    </div>
  );
}

