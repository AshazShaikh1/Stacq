import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getUserId() {
  const { data, error } = await supabase
    .from('stacqs')
    .select('user_id')
    .limit(1)
    .single()

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log(data.user_id)
}

getUserId()
