import { createClient } from '@/lib/supabase/server'
import MasonryFeed from "@/components/feed/masonry-feed"
import { Bookmark } from "lucide-react"

export default async function SavedPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: saves } = await supabase
        .from('saved_collections')
        .select(`
            stacqs (
                id,
                title,
                category,
                profiles(username, avatar_url),
                resources(title, thumbnail)
            )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

    const formattedItems = (saves || [])
        .map((s: any) => s.stacqs)
        .filter(Boolean)
        .map((s: any) => ({
            id: s.id,
            title: s.title,
            aspectRatio: ['aspect-square', 'aspect-video', 'aspect-[4/5]', 'aspect-[3/4]'][Math.floor(Math.random() * 4)],
            thumbnail: s.resources?.[0]?.thumbnail,
            items: s.resources || [],
            stacqer: {
                username: s.profiles?.username || "anonymous",
                avatar: s.profiles?.avatar_url
            },
            remixCount: 0,
        }))

    return (
        <section className="max-w-7xl mx-auto min-h-screen bg-surface px-4 sm:px-6 lg:px-8">

            {/* Header Section */}
            <div className="flex flex-col gap-2 py-6 sm:py-8 pb-4">
                <div className="flex items-center gap-3 sm:gap-4">

                    <div className="p-2 sm:p-3 bg-primary/10 rounded-xl sm:rounded-2xl text-primary shadow-emerald/10 shadow-sm border border-primary/20">
                        <Bookmark className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                    </div>

                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                            My Library
                        </h1>

                        <p className="text-muted-foreground font-medium text-xs sm:text-sm mt-1">
                            {formattedItems.length} high-signal stacqs saved for later.
                        </p>
                    </div>

                </div>
            </div>

            {/* Grid Rendering */}
            <div className="pb-16 sm:pb-20">

                {formattedItems.length > 0 ? (
                    <MasonryFeed items={formattedItems} />
                ) : (

                    <div className="flex flex-col items-center justify-center py-20 sm:py-32 px-4 text-center bg-background rounded-[32px] sm:rounded-[40px] border-2 border-dashed border-border/50 mt-4">

                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-surface rounded-full flex items-center justify-center mb-6 sm:mb-8 border border-border shadow-sm">
                            <Bookmark className="w-8 h-8 sm:w-10 sm:h-10 text-primary/20" />
                        </div>

                        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                            Your library is empty
                        </h2>

                        <p className="text-muted-foreground max-w-sm mt-3 text-sm sm:text-base font-medium">
                            The best stacqers have a well-stocked library. Start building yours by exploring the community feed.
                        </p>

                        <a
                            href="/explore"
                            className="mt-8 sm:mt-10 inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-8 sm:px-10 h-12 sm:h-14 text-sm sm:text-base font-black shadow-emerald shadow-sm transition-all hover:scale-105 active:scale-95"
                        >
                            Explore Stacqs
                        </a>

                    </div>

                )}

            </div>

        </section>
    )
}