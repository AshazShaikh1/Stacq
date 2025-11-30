import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service role client - bypasses RLS
 * Use ONLY in API routes for operations that need to bypass RLS
 * DO NOT expose this to the client
 */
export function createServiceClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

