"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toggleFollow } from "@/lib/actions/social"
import { UserPlus, UserMinus, Loader2 } from "lucide-react"

export function FollowButton({ targetUserId, isInitiallyFollowing }: { targetUserId: string, isInitiallyFollowing: boolean }) {
    const router = useRouter()
    const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing)
    const [loading, setLoading] = useState(false)

    const handleToggle = async () => {
        setLoading(true)
        
        // Push State Optimistically immediately ensuring zero transition lag
        setIsFollowing(!isFollowing) 
        
        const res = await toggleFollow(targetUserId)
        if (res.error) {
            // Revert state smoothly if RPC server constraints crash explicitly
            setIsFollowing(isFollowing) 
            console.error("Follow error:", res.error)
        } else {
            router.refresh() // Sync remote aggregate counts seamlessly in background threads
        }
        setLoading(false)
    }

    return (
        <button 
            onClick={handleToggle} 
            disabled={loading}
            className={isFollowing 
                ? "w-full md:w-auto inline-flex items-center justify-center whitespace-nowrap rounded-full px-10 h-14 text-base font-bold bg-white border border-slate-300 text-slate-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors cursor-pointer select-none shadow-sm" 
                : "w-full md:w-auto inline-flex items-center justify-center whitespace-nowrap bg-primary hover:bg-primary-dark text-white rounded-full px-10 h-14 text-base font-bold shadow-emerald shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none"}
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 
             isFollowing ? <><UserMinus className="w-5 h-5 mr-3" /> Unfollow</> : 
             <><UserPlus className="w-5 h-5 mr-3" /> Follow Curator</>}
        </button>
    )
}
