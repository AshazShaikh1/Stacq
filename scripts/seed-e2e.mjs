import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY


if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function seed() {
  console.log('Seeding E2E mock user...')
  
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: '00000000-0000-0000-0000-000000000000',
      username: 'stacq_test_user',
      display_name: 'Test Curator',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'
    })

  if (error) {
    if (error.code === '42501') {
      console.error('RLS Blocked seeding with Anon Key. Please ensure RLS is disabled or use Service Role Key.')
    } else {
      console.error('Error seeding user:', error)
    }
    process.exit(1)
  }

  console.log('Successfully seeded E2E mock user.')
}

seed()
