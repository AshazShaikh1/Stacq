import { createClient } from '@/lib/supabase/server'
import MasonryFeed from "@/components/feed/masonry-feed"
import { Bookmark } from "lucide-react"

export default async function SavedPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch collections through the join table, including resources and profile details
    const { data: saves } = await supabase
        .from('saved_collections')
        .select(`
            stacqs (
                id,
                title,
                category,
                profiles(username, avatar_url),
                resources(title)
            )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

    // 2. Extract and format the nested stacq objects for MasonryFeed/StacqCard compatibility
    const formattedItems = (saves || [])
        .map((s: any) => s.stacqs)
        .filter(Boolean)
        .map((s: any) => ({
            id: s.id,
            title: s.title,
            aspectRatio: ['aspect-square', 'aspect-video', 'aspect-[4/5]', 'aspect-[3/4]'][Math.floor(Math.random() * 4)],
            items: s.resources || [],
            curator: { 
                username: s.profiles?.username || "anonymous", 
                avatar: s.profiles?.avatar_url 
            },
            remixCount: 0,
        }))

    return (
        <section className="max-w-7xl mx-auto min-h-screen bg-surface">
            {/* Header Section with Design Tokens */}
            <div className="flex flex-col gap-2 p-8 pb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-emerald/10 shadow-sm border border-primary/20">
                        <Bookmark className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">My Library</h1>
                        <p className="text-muted-foreground font-medium text-sm mt-1">
                            {formattedItems.length} high-signal collections saved for later.
                        </p>
                    </div>
                </div>
            </div>

            {/* Grid Rendering */}
            <div className="px-8 pb-20">
                {formattedItems.length > 0 ? (
                    <MasonryFeed items={formattedItems} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center bg-background rounded-[40px] border-2 border-dashed border-border/50 mt-4 mx-2">
                        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-8 border border-border shadow-sm">
                            <Bookmark className="w-10 h-10 text-primary/20" />
                        </div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">Your library is empty</h2>
                        <p className="text-muted-foreground max-w-sm mt-3 text-base font-medium">
                            The best curators have a well-stocked library. Start building yours by exploring the community feed.
                        </p>
                        <a 
                            href="/explore" 
                            className="mt-10 inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-10 h-14 text-base font-black shadow-emerald shadow-sm transition-all hover:scale-105 active:scale-95"
                        >
                            Explore Collections
                        </a>
                    </div>
                )}
            </div>
        </section>
    )
}