import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ResourceCard } from '@/components/stacq/resource-card'
import { StacqBoard } from '@/components/stacq/stacq-board'
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

    const { data: { user: currentUser } } = await supabase.auth.getUser()

    const { data: stacq, error } = await supabase
        .from('stacqs')
        .select(`
            id, title, description, category, user_id, section_order,
            profiles(id, username, display_name, avatar_url),
            resources(id, title, url, thumbnail, note, section, order_index)
        `)
        .eq('id', id)
        .single()

    if (error) {
        return (
            <div className="p-6 sm:p-12 max-w-4xl mx-auto space-y-4 mt-12 bg-background rounded-2xl border-2 border-destructive/20 shadow-sm">
                <h1 className="text-xl sm:text-2xl font-bold text-destructive">Database Error</h1>
                <div className="p-4 bg-destructive/5 text-foreground font-mono text-xs sm:text-sm rounded-lg border border-destructive/10 space-y-2 overflow-x-auto">
                    <p><strong>Message:</strong> {error.message}</p>
                    <p><strong>Code:</strong> {error.code}</p>
                </div>
            </div>
        )
    }

    if (!stacq) notFound()

    const profile = Array.isArray(stacq.profiles) ? stacq.profiles[0] : stacq.profiles
    const isOwner = currentUser?.id === stacq.user_id

    const [followResult, saveResult] = await Promise.all([
        currentUser && !isOwner
            ? supabase.from('follows').select('id')
                .eq('follower_id', currentUser.id)
                .eq('following_id', stacq.user_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        currentUser && !isOwner
            ? supabase.from('saved_collections').select('id')
                .eq('user_id', currentUser.id)
                .eq('stacq_id', id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
    ])

    const isFollowingCreator = !!followResult.data
    const isSaved = !!saveResult.data

    const derivedSections = new Set<string>(stacq.section_order || [])
    if (stacq.resources) {
        stacq.resources.forEach((r: any) => derivedSections.add(r.section || 'Default'))
    }
    derivedSections.add('Default')
    const sections = Array.from(derivedSections)

    return (
        // Added max-w-full and overflow-x-hidden to prevent horizontal jiggle on mobile
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-4 pb-32 md:pb-20 space-y-6 sm:space-y-8 min-h-dvh overflow-x-hidden w-full">

            {/* Inline Editable Header (owner only) */}
            <CollectionHeader stacq={stacq} isOwner={isOwner} />

            {/* Creator Bar + Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-5 border-y border-border gap-6 sm:gap-4">
                <Link href={`/${profile?.username}`} className="flex items-center gap-3 sm:gap-4 group cursor-pointer w-full sm:w-auto">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-primary font-bold border-2 border-background shadow-sm shrink-0 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                        {profile?.avatar_url ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={profile.avatar_url}
                                    alt={profile.username || 'avatar'}
                                    fill
                                    sizes="(max-width: 640px) 40px, 48px"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        ) : (
                            profile?.username?.substring(0, 1).toUpperCase()
                        )}
                    </div>
                    <div className="flex flex-col">
                        <p className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-tight">@{profile?.username}</p>
                        <p className="text-[9px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Stacqer</p>
                    </div>
                </Link>

                {/* Actions: Grid-aware flex for ultra-narrow screens (like Z Fold 5) */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">

                    {/* Group Share and Save together - they stay side-by-side */}
                    <div className="flex items-center gap-2 flex-1 sm:flex-none min-w-fit">
                        <ShareButton title={stacq.title} stacqId={stacq.id} />
                        {!isOwner && (
                            <SaveButton stacqId={stacq.id} isInitiallySaved={isSaved} />
                        )}
                    </div>

                    {/* Follow Button: Now wraps if space is tight */}
                    {!isOwner && profile?.id && (
                        <div className="flex-1 sm:flex-none min-w-[120px]">
                            <FollowButton targetUserId={profile.id} isInitiallyFollowing={isFollowingCreator} />
                        </div>
                    )}

                    {/* Add Resource: Takes full width only if forced by narrow screen */}
                    {isOwner && (
                        <Dialog>
                            <DialogTrigger className="flex-1 sm:flex-none inline-flex items-center justify-center whitespace-nowrap text-xs h-10 bg-primary hover:opacity-90 text-primary-foreground rounded-full px-4 sm:px-8 shadow-sm font-bold transition-all active:scale-95 border-none outline-none">
                                <PlusSquare className="w-4 h-4 mr-2" /> Add Resource
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-[400px] sm:max-w-2xl p-0 border-none bg-transparent shadow-none rounded-3xl overflow-hidden">
                                <AddResourceForm stacqId={stacq.id} availableSections={sections} />
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {/* Interactive Board */}
            <div className="pt-2">
                <StacqBoard initialStacq={stacq} isOwner={isOwner} />
            </div>
        </div>
    )
}