import { createClient } from '@/lib/supabase/server' // Ensure you have a server client
import { redirect } from 'next/navigation'
import LandingPageUI from '@/components/landing' // Move your current UI here

export default async function Page() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // If logged in, send them to the feed immediately
  if (session) {
    redirect('/feed')
  }

  // Otherwise, show the beautiful landing page in your screenshot
  return <LandingPageUI />
}