import { createClient } from '@/lib/supabase/server';
import { LandingPage } from '@/components/landing/LandingPage';
import { FeedPage } from '@/components/feed/FeedPage';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If signed out, show landing page
  if (!user) {
    return <LandingPage />;
  }

  // If signed in, show feed (home) with cards and stacks
  return <FeedPage />;
}
