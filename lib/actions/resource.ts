"use server"

import { createClient } from '@/lib/supabase/server'

export async function fetchMetadata(url: string) {
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            next: { revalidate: 3600 }
        })
        const html = await res.text()

        const getMeta = (propName: string, nameAttr = propName) => {
            const propRegex1 = new RegExp(`<meta[^>]*property=["']${propName}["'][^>]*content=["']([^"']+)["']`, 'i')
            const propRegex2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${propName}["']`, 'i')
            const nameRegex1 = new RegExp(`<meta[^>]*name=["']${nameAttr}["'][^>]*content=["']([^"']+)["']`, 'i')
            const nameRegex2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${nameAttr}["']`, 'i')

            const match = html.match(propRegex1) || html.match(propRegex2) || html.match(nameRegex1) || html.match(nameRegex2)
            return match ? match[1] : null
        }

        const title = getMeta('og:title', 'title') || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1])
        const description = getMeta('og:description', 'description')
        const image = getMeta('og:image', 'twitter:image')

        return { title, description, image }
    } catch (e) {
        return { error: 'Failed to fetch metadata' }
    }
}

export async function addResource(stacqId: string, url: string, note: string, metadata: any) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Security Halt. You must be actively logged in to curate." }

    const { error } = await supabase.from('resources').insert([{
        user_id: user.id, // Mandatory security binding 
        stacq_id: stacqId,
        url,
        title: metadata?.title || url,
        description: metadata?.description,
        thumbnail: metadata?.image,
        note
    }])

    if (error) {
        console.error("Error inserting resource:", error)
        return { error: error.message }
    }

    return { success: true }
}
