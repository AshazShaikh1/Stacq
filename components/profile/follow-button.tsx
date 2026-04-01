"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toggleFollow } from "@/lib/actions/social"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"

export function FollowButton({ targetUserId, isInitiallyFollowing }: { targetUserId: string, isInitiallyFollowing: boolean }) {
    const router = useRouter()
    const { session, openAuthModal } = useAuth()
    const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing)
    const [loading, setLoading] = useState(false)

    const handleToggle = async () => {
        if (!session) {
            openAuthModal('signup')
            return
        }

        // Optimistic Update
        const previousState = isFollowing
        setIsFollowing(!isFollowing)
        
        const res = await toggleFollow(targetUserId)
        if (res.error) {
            setIsFollowing(previousState)
            toast.error(res.error)
        } else {
            toast.success(isFollowing ? "Following curator" : "Unfollowed curator")
            router.refresh()
        }
    }

    return (
        <button
            onClick={handleToggle}
            className={isFollowing
                ? "w-full md:w-auto inline-flex items-center justify-center whitespace-nowrap rounded-full px-10 h-14 text-base font-bold bg-background border border-border text-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors cursor-pointer select-none shadow-sm"
                : "w-full md:w-auto inline-flex items-center justify-center whitespace-nowrap bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-10 h-14 text-base font-bold shadow-emerald shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none"}
        >
            {isFollowing ? <><UserMinus className="w-5 h-5 mr-3" /> Unfollow</> :
                <><UserPlus className="w-5 h-5 mr-3" /> Follow Curator</>}
        </button>
    )
}
