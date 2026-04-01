"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateCollection(id: string, updates: { title?: string, description?: string, category?: string }) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Security Exception: Must be logged in to modify layers." }

    const { error } = await supabase
        .from('stacqs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // Enforces rigid RLS boundaries logically natively

    if (error) return { error: error.message }
    
    revalidatePath(`/stacq/${id}`)
    revalidatePath(`/`)
    return { success: true }
}

export async function updateResource(id: string, updates: { title?: string, note?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    
    revalidatePath(`/stacq/[id]`, 'page')
    return { success: true }
}

export async function deleteResource(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }
    
    revalidatePath(`/stacq/[id]`, 'page')
    return { success: true }
}
