import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function checkOnboardingStatus() {
  const headersList = await headers()
  const currentPath = headersList.get('x-current-path') || '/'
  
  // Skip checks for public paths, static assets, and auth callback
  // This list should match or be a subset of middleware exclusions, but specific to pages
  const isPublic = 
    currentPath.startsWith('/login') ||
    currentPath.startsWith('/signup') ||
    currentPath.startsWith('/auth') ||
    currentPath === '/' || // Landing page is public? Maybe. Assuming landing page is public.
    currentPath.startsWith('/explore')

  // If on public pages (except root if root is protected for logged in users), we might still check 
  // but usually we let middleware handle auth. 
  // However, middleware lets logged-in users go to public pages. 
  // We want to force onboarding even on public pages if they are logged in?
  // User Requirement: "block feed access until onboarding is complete"
  // Feed is usually at / or /feed.

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return // Not logged in, nothing to gate (Middleware handles protection)

  // Fetch onboarding status
  const { data: profile } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single()

  const isCompleted = profile?.onboarding_completed === true

  // If NOT completed
  if (!isCompleted) {
    if (currentPath !== '/onboarding') {
      redirect('/onboarding')
    }
  }

  // If COMPLETED and trying to access /onboarding
  if (isCompleted && currentPath === '/onboarding') {
    redirect('/')
  }
}
