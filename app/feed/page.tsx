import MasonryFeed from "@/components/feed/masonry-feed"
import { createClient } from "@/lib/supabase/server"

export default async function FeedPage() {
    const supabase = await createClient()

    // 1. Fetch from the Trending View instead of the raw table
    const { data: stacqs, error } = await supabase
        .from('trending_stacqs')
        .select(`
            id,
            title,
            category,
            username,
            avatar_url,
            remix_count,
            resources(*)
        `)
        .limit(40)

    if (error) {
        console.error("Feed Fetch Error:", error)
    }

    const formattedItems = (stacqs || []).map((s: any) => {
        const coverImage = s.resources?.[0]?.thumbnail || `https://source.unsplash.com/featured/?technology,abstract&sig=${s.id}`;

        return {
            id: s.id,
            title: s.title,
            category: s.category,
            thumbnail: coverImage,
            items: s.resources || [],
            curator: {
                username: s.username || "anonymous",
                avatar: s.avatar_url
            },
        }
    })

    return (
        <div className="min-h-screen bg-surface">
            {/* Added responsive padding-bottom to account for mobile bottom nav via safe area or standard spacing */}
            <div className="max-w-7xl mx-auto py-8 px-4 md:px-8 pb-20 md:pb-8">
                <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-foreground leading-tight">Discovery</h1>
                        <p className="text-muted-foreground font-semibold mt-1">Trending collections from the community.</p>
                    </div>
                </div>

                {formattedItems.length > 0 ? (
                    <MasonryFeed items={formattedItems} />
                ) : (
                    <div className="py-32 text-center bg-background border-2 border-dashed border-border/50 rounded-[3rem] shadow-sm flex flex-col items-center justify-center px-6">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-8 border border-primary/20 text-primary">
                            <PlusSquare className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground tracking-tight">No collections yet</h3>
                        <p className="text-muted-foreground mt-3 font-medium max-w-sm text-base leading-relaxed">
                            Be the first to ship a high-signal stack to the community! Share your favorite resources today.
                        </p>
                        <a 
                            href="/stacq/new" 
                            className="mt-10 inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-12 h-14 text-base font-black shadow-emerald shadow-sm transition-all hover:scale-105 active:scale-95"
                        >
                            Create Your First Stacq
                        </a>
                    </div>
                )}
            </div>
        </div>
    )
}

// Added missing import for the empty state
import { PlusSquare } from "lucide-react"