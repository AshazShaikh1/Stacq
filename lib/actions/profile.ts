"use server"

import { createClient } from '@/lib/supabase/server'

export async function updateProfile(
    userId: string, 
    currentUsername: string, 
    updates: { display_name?: string, username?: string, bio?: string, twitter?: string, github?: string, website?: string, social_links?: any[] }
) {
    const supabase = await createClient()

    // Verify session
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== userId) {
        return { error: "Unauthorized request. You can only edit your own profile." }
    }

    const payload: any = {}

    // Map Partial Keys safely preserving nulls but ignoring undefined closures
    if (updates.display_name !== undefined) payload.display_name = updates.display_name
    if (updates.bio !== undefined) payload.bio = updates.bio
    if (updates.social_links !== undefined) payload.social_links = updates.social_links
    if (updates.twitter !== undefined) payload.twitter = updates.twitter.replace('https://x.com/', '').replace('https://twitter.com/', '')
    if (updates.github !== undefined) payload.github = updates.github.replace('https://github.com/', '')
    if (updates.website !== undefined) payload.website = updates.website.replace('https://', '').replace('http://', '')

    let newUsername = currentUsername

    // Only strike the unique database check if the username payload explicitly demands mutation
    if (updates.username !== undefined && updates.username.trim().toLowerCase() !== currentUsername) {
        newUsername = updates.username.trim().toLowerCase()
        const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', newUsername)
            .single()
            
        if (existing) {
            return { error: "That username is already taken by another curator!" }
        }
        payload.username = newUsername
    }

    // Process and sanitize inputs before pushing to DB
    const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)

    if (error) {
        console.error("Profile Update Error:", error)
        return { error: "Database error updating profile. Please try again." }
    }

    return { success: true, newUsername }
}
