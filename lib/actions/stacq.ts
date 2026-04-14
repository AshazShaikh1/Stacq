/* eslint-disable */
"use server"

import { createClient } from '@/lib/supabase/server'
import { stacqSchema } from '@/lib/validations/schemas'

export async function generateSlug(title: string): Promise<string> {
    const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
        .replace(/(^-|-$)+/g, '') || // Remove leading and trailing hyphens
        'untitled-stacq'

    // Add a small random string to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6)
    return `${baseSlug}-${randomSuffix}`
}

export async function createStacq(title: string, description: string, category: string, thumbnail?: string) {
    const supabase = await createClient()

    // 1. Validation via Zod
    const validation = stacqSchema.safeParse({ title, description, category, thumbnail })
    if (!validation.success) {
        return { error: validation.error.issues[0].message }
    }
 
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        return { error: "You must be logged in to create a stacq." }
    }

 
    const slug = await generateSlug(title);

    const { data, error } = await supabase.from('stacqs').insert([{
        user_id: user.id,
        title,
        description,
        category,
        thumbnail,
        slug
    }]).select('id, slug')

    if (error) {
        console.error("DB Error:", error.message)
        return { error: error.message }
    }
    
    // Safely extract the UUID whether Supabase returned an Array or Object
    const item = Array.isArray(data) ? data[0] : data
    const stacqId = (item as { id: string })?.id

    if (!stacqId) {
        return { error: "Stacq saved, but database delayed returning the ID. Check your feed!" }
    }
    const returnedSlug = (item as { slug: string })?.slug
    
    return { success: true, stacqId, slug: returnedSlug || slug }
}

