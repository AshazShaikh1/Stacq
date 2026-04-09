import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import MasonryFeed from "@/components/feed/masonry-feed"
import { CreateStacqModal } from "@/components/stacq/create-stacq-modal"
import { InlineProfileEditor } from "@/components/profile/inline-profile-editor"
import { InlineSocialLinks } from "@/components/profile/inline-social-links"
import { ShareButton } from "@/components/profile/share-button"
import { FollowButton } from "@/components/profile/follow-button"
import { PlusSquare, Compass } from "lucide-react"
import { ProfileHeaderClient } from "@/components/profile/profile-header-client"

// ISR: Cache profile pages for 120 seconds
export const revalidate = 120

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const supabase = await createClient()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

    if (!profile) notFound()

    const { data: stacqs } = await supabase
        .from('stacqs')
        .select(`
            id,
            title,
            category,
            profiles(username, avatar_url),
            resources(title, thumbnail)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const isOwnProfile = currentUser?.id === profile.id

    let isFollowing = false
    if (currentUser && !isOwnProfile) {
        const { data: followRecord } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', profile.id)
            .maybeSingle()
        isFollowing = !!followRecord
    }

    const collectionCount = stacqs?.length || 0
    const resourceCount = (stacqs || []).reduce((acc: number, stacq: any) => acc + (stacq.resources?.length || 0), 0)
    const followersCount = profile.followers_count || 0

    const formattedItems = (stacqs || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        aspectRatio: ['aspect-square', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-[2/3]'][Math.floor(Math.random() * 4)],
        thumbnail: s.resources?.[0]?.thumbnail,
        items: s.resources || [],
        curator: { username: s.profiles?.username || "anonymous", avatar: s.profiles?.avatar_url },
        remixCount: 0,
    }))

    return (
        <div className="min-h-screen bg-surface pb-24 sm:pb-20">

            {/* Header */}
            <ProfileHeaderClient 
                profile={profile}
                isOwnProfile={isOwnProfile}
                initialIsFollowing={isFollowing}
                initialFollowersCount={followersCount}
                stacqCount={collectionCount}
                resourceCount={resourceCount}
            />

            {/* Masonry Feed */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 md:py-16">

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-6 sm:mb-8 text-foreground">
                    Curated Stacqs
                </h2>

                {formattedItems.length > 0 ? (
                    <MasonryFeed items={formattedItems} />
                ) : (

                    <div className="flex flex-col items-center justify-center p-10 sm:p-12 md:p-24 bg-background rounded-2xl sm:rounded-3xl border-2 border-dashed border-border shadow-sm mt-4">

                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 border border-primary/20">
                            <Compass className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-foreground mb-3 tracking-tight">
                            No stacqs yet
                        </h3>

                        <p className="text-muted-foreground text-center max-w-md mb-6 sm:mb-8 text-sm sm:text-lg leading-relaxed">
                            {isOwnProfile
                                ? "You haven't started curating yet. Build your first stacq to compile and share your favorite internet resources!"
                                : "This stacqer hasn't published any stacqs to their profile yet."}
                        </p>

                        {isOwnProfile && (
                            <CreateStacqModal>
                                <button className="inline-flex items-center justify-center whitespace-nowrap text-sm sm:text-base bg-primary hover:bg-primary-dark text-white rounded-full px-6 sm:px-8 h-12 sm:h-14 font-bold shadow-emerald shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 outline-none border-none">
                                    <PlusSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
                                    Start Curating
                                </button>
                            </CreateStacqModal>
                        )}

                    </div>

                )}

            </div>

        </div>
    )
}