import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect authenticated users to feed, others to explore
  if (user) {
    redirect('/feed');
  } else {
    redirect('/explore');
  }
}

