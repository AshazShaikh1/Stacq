"use client"

import { useState } from "react"
import Image from "next/image"
import { InlineProfileEditor } from "./inline-profile-editor"
import { InlineSocialLinks } from "./inline-social-links"
import { ShareButton } from "./share-button"
import { FollowButton } from "./follow-button"

export function ProfileHeaderClient({ 
    profile, 
    isOwnProfile, 
    initialIsFollowing,
    initialFollowersCount,
    stacqCount,
    resourceCount
}: { 
    profile: any, 
    isOwnProfile: boolean, 
    initialIsFollowing: boolean,
    initialFollowersCount: number,
    stacqCount: number,
    resourceCount: number
}) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [followersCount, setFollowersCount] = useState(initialFollowersCount)

    const handleFollowChange = (following: boolean) => {
        setIsFollowing(following)
        setFollowersCount(prev => following ? prev + 1 : Math.max(0, prev - 1))
    }

    return (
        <div className="bg-background border-b border-border">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-12 md:py-16">

                <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start md:items-center">

                    {/* Avatar */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-primary/10 border-4 border-background shadow-sm shrink-0 flex items-center justify-center text-primary text-3xl sm:text-4xl font-black">
                        {profile.avatar_url ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={profile.avatar_url}
                                    alt={profile.display_name || profile.username}
                                    fill
                                    sizes="128px"
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        ) : (
                            (profile.display_name || profile.username || 'U').charAt(0).toUpperCase()
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 space-y-4 min-w-0">
                        <InlineProfileEditor profile={profile} isOwnProfile={isOwnProfile} />
                        <InlineSocialLinks profile={profile} isOwnProfile={isOwnProfile} />
                    </div>

                    {/* Action Buttons */}
                    <div className="w-full md:w-auto pt-2 sm:pt-4 md:pt-0 flex flex-col sm:flex-row items-center gap-3">
                        {isOwnProfile ? (
                            <ShareButton username={profile.username} />
                        ) : (
                            <FollowButton 
                                targetUserId={profile.id} 
                                isInitiallyFollowing={isFollowing} 
                                onFollowChange={handleFollowChange}
                                targetUsername={profile.display_name || profile.username}
                            />
                        )}
                    </div>

                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-6 sm:gap-8 md:gap-16 mt-10 sm:mt-12 py-6 sm:py-8 border-t border-border/50">

                    <div className="text-left">
                        <p className="text-3xl sm:text-4xl md:text-5xl font-black text-primary tracking-tight">
                            {stacqCount}
                        </p>
                        <p className="text-[10px] sm:text-xs md:text-sm font-bold tracking-widest text-muted-foreground uppercase mt-2">
                            Stacqs
                        </p>
                    </div>

                    <div className="text-left">
                        <p className="text-3xl sm:text-4xl md:text-5xl font-black text-primary tracking-tight">
                            {resourceCount}
                        </p>
                        <p className="text-[10px] sm:text-xs md:text-sm font-bold tracking-widest text-muted-foreground uppercase mt-2">
                            Resources
                        </p>
                    </div>

                    <div className="text-left col-span-2 sm:col-span-1">
                        <p className="text-3xl sm:text-4xl md:text-5xl font-black text-primary tracking-tight">
                            {followersCount}
                        </p>
                        <p className="text-[10px] sm:text-xs md:text-sm font-bold tracking-widest text-muted-foreground uppercase mt-2">
                            Followers
                        </p>
                    </div>

                </div>

            </div>
        </div>
    )
}
