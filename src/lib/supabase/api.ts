import { createServerClient } from '@supabase/ssr'
import { NextRequest } from 'next/server'

export async function createClient(request: NextRequest) {
  // For API routes, we just need to read cookies, not set them
  // Cookie setting is handled by the middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {
          // No-op in API routes - cookies are managed by middleware
        },
        remove() {
          // No-op in API routes - cookies are managed by middleware
        },
      },
    }
  )
  
  return supabase
}
