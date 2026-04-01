"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/** * Toggles a "Save" for a collection. * If it exists, delete it (unsave). If not, insert it (save). */
export async function toggleSaveCollection(stacqId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Security Exception: Must be logged in to save collections." }

    // 1. Check if the save already exists
    const { data: existingSave } = await supabase
        .from('saved_collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('stacq_id', stacqId)
        .maybeSingle()

    if (existingSave) {
        // 2. Unsave (Delete)
        const { error } = await supabase
            .from('saved_collections')
            .delete()
            .eq('id', existingSave.id)

        if (error) return { error: error.message }
    } else {
        // 3. Save (Insert)
        const { error } = await supabase
            .from('saved_collections')
            .insert([{ user_id: user.id, stacq_id: stacqId }])

        if (error) return { error: error.message }
    }

    revalidatePath(`/stacq/${stacqId}`)
    return { success: true }
}

export async function updateCollection(id: string, updates: { title?: string, description?: string, category?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Security Exception: Must be logged in to modify layers." }

    const { error } = await supabase
        .from('stacqs')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)

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