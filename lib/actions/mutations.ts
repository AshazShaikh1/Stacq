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

export async function updateCollection(id: string, updates: { title?: string, description?: string, category?: string, thumbnail?: string, section_order?: string[] }) {
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
 
export async function updateResource(id: string, updates: { title?: string, note?: string, thumbnail?: string, section?: string }) {
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

export async function deleteCollection(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    const { error } = await supabase
        .from('stacqs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath(`/`)
    return { success: true }
}

export async function updateResourceOrders(updates: { id: string, section: string, order_index: number }[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    // Supabase JS doesn't have a built-in multiple-update yet without upserting all columns.
    // Instead, we will perform sequential updates because the array size is typically small for a single user interaction.
    for (const item of updates) {
        const { error } = await supabase
            .from('resources')
            .update({ section: item.section, order_index: item.order_index })
            .eq('id', item.id)
            .eq('user_id', user.id)
            
        if (error) {
            console.error("Resource ordering update error:", error)
        }
    }

    return { success: true }
}

export async function renameSection(stacqId: string, oldName: string, newName: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Unauthorized" }

    // 1. Fetch current collection
    const { data: stacq, error: fetchError } = await supabase
        .from('stacqs')
        .select('section_order')
        .eq('id', stacqId)
        .eq('user_id', user.id)
        .single()

    if (fetchError || !stacq) return { error: "Failed to fetch collection for rename" }

    // 2. Replace section in order
    const nextOrder = (stacq.section_order || []).map((s: string) => s === oldName ? newName : s)

    // 3. Update collection's section_order
    const { error: updateStacqError } = await supabase
        .from('stacqs')
        .update({ section_order: nextOrder })
        .eq('id', stacqId)

    if (updateStacqError) return { error: "Failed to update section order" }

    // 4. Update all resources in that section
    const { error: updateResourcesError } = await supabase
        .from('resources')
        .update({ section: newName })
        .eq('stacq_id', stacqId)
        .eq('section', oldName)

    if (updateResourcesError) {
        console.error("Failed to migrate resources to new section name:", updateResourcesError)
        return { error: "Failed to update resources" }
    }

    revalidatePath(`/stacq/${stacqId}`)
    return { success: true }
}