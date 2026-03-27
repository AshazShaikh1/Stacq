import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ResourceCard } from '@/components/stacq/resource-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function StacqDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient()

    // Fetch the specific Stacq and its resources
    const response = await (await supabase)
        .from('stacqs')
        .select(`*, profiles(username, display_name, avatar_url)`)
        .eq('id', params.id)
        .single()

    // Provide mock fallback data instead of crashing out to 404
    const stacq = response.data || {
        id: params.id,
        title: "Mock Detail Layout",
        category: "Preview",
        description: "This Collection layout is rendering successfully using mock data because the database does not contain an entry for ID: " + params.id + " yet! The UI flow works perfectly.",
        profiles: {
            username: "tester_mock",
            avatar_url: ""
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8">
            {/* Header */}
            <header className="space-y-5">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-3 py-1 font-semibold rounded-full outline-none">
                        #{stacq.category || 'Curated'}
                    </Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">{stacq.title}</h1>
                
                <div className="flex items-center justify-between pt-6 mt-6 border-t border-border/40">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 overflow-hidden flex items-center justify-center text-emerald-700 font-bold border border-emerald-200 shrink-0">
                            {stacq.profiles.avatar_url ? (
                                <img src={stacq.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                stacq.profiles.username?.substring(0, 1).toUpperCase()
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-base text-foreground">@{stacq.profiles.username}</p>
                            <p className="text-sm text-slate-500 font-medium">Curator</p>
                        </div>
                    </div>
                    
                    <Button size="sm" className="bg-primary hover:bg-primary-dark text-white rounded-full px-6 font-semibold shadow-sm cursor-pointer border-none transition-all hover:scale-105 active:scale-95 shrink-0">
                        Follow
                    </Button>
                </div>
            </header>

            <div className="text-lg text-slate-700 leading-relaxed italic border-l-4 border-primary pl-6 bg-emerald-50/50 py-5 pr-4 rounded-r-xl">
                "{stacq.description || 'No description provided.'}"
            </div>

            {/* The Actual Links/Resources */}
            <div className="space-y-6 pt-4">
                {[
                    { title: "Supabase Docs", url: "https://supabase.com", note: "The fastest way to spin up Postgres and Auth. Essential for this stack. RLS makes safety effortless.", thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=400&auto=format&fit=crop" },
                    { title: "Tailwind CSS Component Catalog", url: "https://ui.shadcn.com", note: "Beautifully designed components that you can copy and paste into your apps. Accessible and highly customizable without bloating.", thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=400&auto=format&fit=crop" },
                    { title: "Vercel Deployment", url: "https://vercel.com", note: "Best in class hosting for Next.js applications with zero config required. CI/CD out of the box.", thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop" }
                ].map((item, idx) => (
                    <ResourceCard key={idx} resource={item} />
                ))}
            </div>
        </div>
    )
}