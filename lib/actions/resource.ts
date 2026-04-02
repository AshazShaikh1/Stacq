"use server"

import { createClient } from '@/lib/supabase/server'

export async function fetchMetadata(url: string) {
    try {
        const res = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
            },
            next: { revalidate: 3600 }
        })
        
        if (!res.ok) throw new Error("Link unreachable")
        
        const html = await res.text()

        // 1. Extract all meta tags into an object
        const metaTags = html.match(/<meta[^>]+>/gi) || [];
        const meta: Record<string, string> = {};
        
        metaTags.forEach(tag => {
            const property = tag.match(/property=["']([^"']+)["']/i)?.[1] || 
                            tag.match(/name=["']([^"']+)["']/i)?.[1];
            const content = tag.match(/content=["']([^"']+)["']/i)?.[1];
            if (property && content) {
                meta[property.toLowerCase()] = content;
            }
        });

        // 2. Extract Title fallbacks
        const title = meta['og:title'] || 
                      meta['twitter:title'] || 
                      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || 
                      url;

        // 3. Extract Description fallbacks
        const description = meta['og:description'] || 
                            meta['twitter:description'] || 
                            meta['description'];

        // 4. Extract Image fallbacks
        const image = meta['og:image'] || 
                      meta['twitter:image'] || 
                      meta['thumbnail'] || 
                      html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i)?.[1];

        // Ensure relative image URLs are handled (basic check)
        let finalImage = image;
        if (image && !image.startsWith('http')) {
            try {
                const baseUrl = new URL(url);
                finalImage = new URL(image, baseUrl.origin).toString();
            } catch (e) {
                // Keep original if parsing fails
            }
        }

        return { 
            title: title?.trim(), 
            description: description?.trim(), 
            image: finalImage 
        }
    } catch (e) {
        console.error("Metadata fetch error:", e);
        return { error: 'Could not render a preview for this link.' }
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
