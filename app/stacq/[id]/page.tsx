import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ResourceCard } from '@/components/stacq/resource-card'
import { AddResourceForm } from '@/components/stacq/add-resource-form'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { PlusSquare } from 'lucide-react'

export default async function StacqDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id || id === 'undefined' || id === 'null') {
        notFound()
    }

    const supabase = await createClient()

    // Fetch the specific Stacq and its resources
    const { data: stacq, error } = await supabase
        .from('stacqs')
        .select(`*, profiles(username, display_name, avatar_url), resources(*)`)
        .eq('id', id)
        .single()

    if (error) {
        return (
            <div className="p-12 max-w-4xl mx-auto space-y-4 mt-12 bg-white rounded-2xl border-2 border-red-100 shadow-sm">
                <h1 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    Database Supabase Error
                </h1>
                <p className="text-slate-600 font-medium">The collection query failed. This is usually due to a missing relation or RLS policy.</p>
                <div className="p-4 bg-red-50 text-red-900 font-mono text-sm rounded-lg border border-red-200 space-y-2">
                    <p><strong>Message:</strong> {error.message}</p>
                    <p><strong>Details:</strong> {error.details || 'None'}</p>
                    <p><strong>Hint:</strong> {error.hint || 'None'}</p>
                    <p><strong>Code:</strong> {error.code}</p>
                </div>
            </div>
        )
    }

    if (!stacq) notFound()

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8">
            
            {/* Top Controller Bar */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none px-3 py-1 font-semibold rounded-full outline-none">
                        #{stacq.category || 'Curated'}
                    </Badge>
                </div>

                <Dialog>
                    <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm h-9 bg-primary hover:bg-primary-dark text-white rounded-full px-5 shadow-sm font-semibold cursor-pointer border-none transition-transform hover:scale-105 active:scale-95">
                        <PlusSquare className="w-4 h-4 mr-2" /> Add Resource
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl p-0 border-none bg-transparent shadow-none">
                        <AddResourceForm stacqId={stacq.id} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Header */}
            <header className="space-y-5">
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
                {stacq.resources && stacq.resources.length > 0 ? (
                    stacq.resources.map((item: any) => (
                        <ResourceCard key={item.id} resource={item} />
                    ))
                ) : (
                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 mt-8">
                        <p className="text-slate-600 font-medium text-lg">This collection is currently empty.</p>
                        <p className="text-slate-500 mt-1">Be the first to curate a valuable resource!</p>
                    </div>
                )}
            </div>
        </div>
    )
}