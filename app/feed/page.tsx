import MasonryFeed from "@/components/feed/masonry-feed"
import { createClient } from "@/lib/supabase/server"
import { PlusSquare } from "lucide-react"

// ISR: Re-generate this page at most once every 60 seconds
export const revalidate = 60

export default async function FeedPage() {
    const supabase = await createClient()

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

            <div className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 md:px-8 pb-24 sm:pb-20 md:pb-8">

                <div className="mb-8 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">

                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
                            Discovery
                        </h1>

                        <p className="text-sm sm:text-base text-muted-foreground font-semibold mt-1">
                            Trending collections from the community.
                        </p>
                    </div>

                </div>

                {formattedItems.length > 0 ? (
                    <MasonryFeed items={formattedItems} />
                ) : (

                    <div className="py-20 sm:py-32 text-center bg-background border-2 border-dashed border-border/50 rounded-4xl sm:rounded-[3rem] shadow-sm flex flex-col items-center justify-center px-4 sm:px-6">

                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 sm:mb-8 border border-primary/20 text-primary">
                            <PlusSquare className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                            No collections yet
                        </h3>

                        <p className="text-muted-foreground mt-3 font-medium max-w-sm text-sm sm:text-base leading-relaxed">
                            Be the first to ship a high-signal stack to the community! Share your favorite resources today.
                        </p>

                        <a
                            href="/stacq/new"
                            className="mt-8 sm:mt-10 inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-8 sm:px-12 h-12 sm:h-14 text-sm sm:text-base font-black shadow-emerald shadow-sm transition-all hover:scale-105 active:scale-95"
                        >
                            Create Your First Stacq
                        </a>

                    </div>

                )}

            </div>
        </div>
    )
}