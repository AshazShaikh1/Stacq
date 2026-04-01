import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ResourceCard } from '@/components/stacq/resource-card'
import { AddResourceForm } from '@/components/stacq/add-resource-form'
import { CollectionHeader } from '@/components/stacq/collection-header'
import { FollowButton } from '@/components/profile/follow-button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { PlusSquare } from 'lucide-react'
import { SaveButton } from '@/components/stacq/save-button'
import { ShareButton } from '@/components/stacq/share-button'

export default async function StacqDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!id || id === 'undefined' || id === 'null') {
        notFound()
    }

    const supabase = await createClient()

    // Get current user for ownership checks
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    // Fetch the collection and its resources + creator profile
    const { data: stacq, error } = await supabase
        .from('stacqs')
        .select(`*, profiles(id, username, display_name, avatar_url), resources(*)`)
        .eq('id', id)
        .single()

    if (error) {
        return (
            <div className="p-12 max-w-4xl mx-auto space-y-4 mt-12 bg-background rounded-2xl border-2 border-destructive/20 shadow-sm">
                <h1 className="text-2xl font-bold text-destructive">Database Error</h1>
                <div className="p-4 bg-destructive/5 text-foreground font-mono text-sm rounded-lg border border-destructive/10 space-y-2">
                    <p><strong>Message:</strong> {error.message}</p>
                    <p><strong>Details:</strong> {error.details || 'None'}</p>
                    <p><strong>Hint:</strong> {error.hint || 'None'}</p>
                    <p><strong>Code:</strong> {error.code}</p>
                </div>
            </div>
        )
    }

    if (!stacq) notFound()

    const isOwner = currentUser?.id === stacq.user_id

    // Check if current user already follows the collection creator
    let isFollowingCreator = false
    if (currentUser && !isOwner) {
        const { data: followRecord } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', stacq.user_id)
            .maybeSingle()
        isFollowingCreator = !!followRecord
    }

    let isSaved = false
    if (currentUser && !isOwner) {
        const { data: saveRecord } = await supabase
            .from('saved_collections')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('stacq_id', id)
            .maybeSingle()
        isSaved = !!saveRecord
    }

    return (
        <div className="max-w-4xl mx-auto p-6 md:p-12 pb-24 md:pb-12 space-y-8 min-h-screen">

            {/* Inline Editable Collection Header (owner only) */}
            <CollectionHeader stacq={stacq} isOwner={isOwner} />

            {/* Creator Bar + Follow/Save Actions */}
            <div className="flex items-center justify-between py-6 border-y border-border">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold border-2 border-background shadow-sm shrink-0">
                        {stacq.profiles?.avatar_url ? (
                            <img src={stacq.profiles.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            stacq.profiles?.username?.substring(0, 1).toUpperCase()
                        )}
                    </div>
                    <div>
                        <p className="font-bold text-base text-foreground">@{stacq.profiles?.username}</p>
                        <p className="text-sm text-muted-foreground font-medium">Curator</p>
                    </div>
                </div>

                {/* Follow or Add Resource depending on role */}
                <div className="flex items-center gap-3">
                    <ShareButton title={stacq.title} collectionId={stacq.id} />
                    {!isOwner && (
                        <SaveButton stacqId={stacq.id} isInitiallySaved={isSaved} />
                    )}
                    {!isOwner && stacq.profiles?.id && (
                        <FollowButton targetUserId={stacq.profiles.id} isInitiallyFollowing={isFollowingCreator} />
                    )}

                    {isOwner && (
                        <Dialog>
                            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap text-sm h-11 bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-8 shadow-emerald shadow-sm font-bold cursor-pointer border-none transition-transform hover:scale-105 active:scale-95 outline-none">
                                <PlusSquare className="w-4 h-4 mr-2" /> Add Resource
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl p-0 border-none bg-transparent shadow-none">
                                <AddResourceForm stacqId={stacq.id} />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* Resources List */}
            <div className="space-y-6 pt-2">
                {stacq.resources && stacq.resources.length > 0 ? (
                    stacq.resources.map((item: any) => (
                        <ResourceCard key={item.id} resource={item} isOwner={isOwner} />
                    ))
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-surface/50 mt-4">
                        <p className="text-foreground/70 font-semibold text-lg">This collection is empty.</p>
                        <p className="text-muted-foreground mt-2 text-base max-w-xs mx-auto">
                            {isOwner ? "Time to build! Click \"Add Resource\" above to curate your first link." : "Check back soon — the curator is still refining this stack."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}