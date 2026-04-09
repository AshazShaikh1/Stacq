import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LandingPageUI from '@/components/landing'

export default async function Page() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/feed')
  }

  return <LandingPageUI />
}