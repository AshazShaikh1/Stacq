"use server"

import { createClient } from '@/lib/supabase/server'

export async function createStacq(title: string, description: string, category: string, thumbnail?: string) {
    const supabase = await createClient()
 
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return { error: "You must be logged in to create a stacq." }
    }
 
    const { data, error } = await supabase.from('stacqs').insert([{
        user_id: user.id,
        title,
        description,
        category,
        thumbnail
    }]).select()

    if (error) {
        console.error("DB Error:", error.message)
        return { error: error.message }
    }
    
    // Safely extract the UUID whether Supabase returned an Array or Object
    const stacqId = Array.isArray(data) ? (data as any[])[0]?.id : (data as any)?.id

    if (!stacqId) {
        return { error: "Stacq saved, but database delayed returning the ID. Check your feed!" }
    }
    
    return { success: true, stacqId }
}
