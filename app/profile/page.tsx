import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfileRedirect() {
    const supabase = await createClient()
    
    // Grab the current active user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
        
    // Fetch their public username to cleanly route them to their SEO-friendly profile
    const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
    
    if (profile?.username) {
        redirect(`/${profile.username}`)
    } else {
        // Fallback if profile creation was corrupted
        redirect('/feed') 
    }
}
