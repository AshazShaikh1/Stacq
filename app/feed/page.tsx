import MasonryFeed from "@/components/feed/masonry-feed"
import { createClient } from "@/lib/supabase/server"

export default async function FeedPage() {
    const supabase = await createClient()

    // Fetch live feed data replacing all mocked JSON
    const { data: stacqs } = await supabase
        .from('stacqs')
        .select(`
            id,
            title,
            category,
            profiles(username, avatar_url),
            resources(title)
        `)
        .order('created_at', { ascending: false })

    // Format relation data to perfectly map into the generic StacqCard structural expectations
    const formattedItems = (stacqs || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        aspectRatio: ['aspect-square', 'aspect-video', 'aspect-[4/5]', 'aspect-[3/4]'][Math.floor(Math.random() * 4)],
        items: s.resources || [],
        curator: { username: s.profiles?.username || "anonymous", avatar: s.profiles?.avatar_url },
        remixCount: 0,
    }))

    return (
        <div className="min-h-screen bg-surface">
            <div className="max-w-7xl mx-auto py-8 px-4 md:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Feed</h1>
                    <p className="text-muted-foreground mt-1">Discover what curators are checking out.</p>
                </div>
                <MasonryFeed items={formattedItems} />
            </div>
        </div>
    )
}