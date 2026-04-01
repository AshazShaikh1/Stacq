import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import MasonryFeed from "@/components/feed/masonry-feed"
import { CreateStacqModal } from "@/components/stacq/create-stacq-modal"
import { InlineProfileEditor } from "@/components/profile/inline-profile-editor"
import { InlineSocialLinks } from "@/components/profile/inline-social-links"
import { ShareButton } from "@/components/profile/share-button"
import { FollowButton } from "@/components/profile/follow-button"
import { PlusSquare, Compass } from "lucide-react"

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const supabase = await createClient()

    // 1. Fetch Profile Data natively via the public username string
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

    if (!profile) notFound()

    // 2. Fetch Stacqs filtered safely to this specific user
    const { data: stacqs } = await supabase
        .from('stacqs')
        .select(`
            id,
            title,
            category,
            profiles(username, avatar_url),
            resources(title)
        `)
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

    // 3. Evaluate "Owner" mechanics for gating private UI elements
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const isOwnProfile = currentUser?.id === profile.id

    // 4. Check follow state (only query if a user is logged in and viewing someone else)
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

    // 4. Calculate Aggregate Statistics
    const collectionCount = stacqs?.length || 0
    const resourceCount = (stacqs || []).reduce((acc: number, stacq: any) => acc + (stacq.resources?.length || 0), 0)
    const followersCount = profile.followers_count || 0

    // Map standard data objects over to Masonry compatibility structures
    const formattedItems = (stacqs || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        aspectRatio: ['aspect-square', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-[2/3]'][Math.floor(Math.random() * 4)],
        items: s.resources || [],
        curator: { username: s.profiles?.username || "anonymous", avatar: s.profiles?.avatar_url },
        remixCount: 0,
    }))

    return (
        <div className="min-h-screen bg-surface pb-20">
            {/* Header Section */}
            <div className="bg-background border-b border-border">
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-12 md:py-16">
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        {/* Avatar Circle */}
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-primary/10 border-4 border-background shadow-sm shrink-0 flex items-center justify-center text-primary text-4xl font-black">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.display_name || profile.username} className="w-full h-full object-cover" />
                            ) : (
                                (profile.display_name || profile.username || 'U').charAt(0).toUpperCase()
                            )}
                        </div>

                        {/* Inline Editable Name / Username / Bio + Social Links */}
                        <div className="flex-1 space-y-4 min-w-0">
                            <InlineProfileEditor profile={profile} isOwnProfile={isOwnProfile} />
                            <InlineSocialLinks profile={profile} isOwnProfile={isOwnProfile} />
                        </div>

                        {/* Action buttons: Share (own) or Follow (visitor) */}
                        <div className="w-full md:w-auto pt-4 md:pt-0 flex flex-col md:flex-row items-center gap-3">
                            {isOwnProfile ? (
                                <ShareButton username={profile.username} />
                            ) : (
                                <FollowButton targetUserId={profile.id} isInitiallyFollowing={isFollowing} />
                            )}
                        </div>
                    </div>


                    {/* Giant Performance Stats Row */}
                    <div className="flex flex-wrap items-center gap-10 md:gap-16 mt-12 py-8 border-t border-border/50">
                        <div className="text-left">
                            <p className="text-4xl md:text-5xl font-black text-primary tracking-tight">{collectionCount}</p>
                            <p className="text-xs md:text-sm font-bold tracking-widest text-muted-foreground uppercase mt-2">Collections</p>
                        </div>
                        <div className="text-left">
                            <p className="text-4xl md:text-5xl font-black text-primary tracking-tight">{resourceCount}</p>
                            <p className="text-xs md:text-sm font-bold tracking-widest text-muted-foreground uppercase mt-2">Resources</p>
                        </div>
                        <div className="text-left">
                            <p className="text-4xl md:text-5xl font-black text-primary tracking-tight">{followersCount}</p>
                            <p className="text-xs md:text-sm font-bold tracking-widest text-muted-foreground uppercase mt-2">Followers</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* The Grid / Masonry Feed Execution */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
                <h2 className="text-2xl font-bold tracking-tight mb-8 text-foreground">Curated Collections</h2>

                {formattedItems.length > 0 ? (
                    <MasonryFeed items={formattedItems} />
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 md:p-24 bg-background rounded-3xl border-2 border-dashed border-border shadow-sm mt-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                            <Compass className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="text-2xl font-black text-foreground mb-3 tracking-tight">No collections yet</h3>
                        <p className="text-muted-foreground text-center max-w-md mb-8 text-lg leading-relaxed">
                            {isOwnProfile
                                ? "You haven't started curating yet. Build your first stack to compile and share your favorite internet resources!"
                                : "This curator hasn't published any collections to their profile yet."}
                        </p>

                        {isOwnProfile && (
                            <CreateStacqModal>
                                <button className="inline-flex items-center justify-center whitespace-nowrap text-base bg-primary hover:bg-primary-dark text-white rounded-full px-8 h-14 font-bold shadow-emerald shadow-md cursor-pointer transition-transform hover:scale-105 active:scale-95 outline-none border-none">
                                    <PlusSquare className="w-5 h-5 mr-3" /> Start Curating
                                </button>
                            </CreateStacqModal>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
