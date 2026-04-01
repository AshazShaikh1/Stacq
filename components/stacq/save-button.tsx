"use client"

import { useState } from "react"
import { Bookmark, Loader2 } from "lucide-react"
import { toggleSaveCollection } from "@/lib/actions/mutations"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-provider"
import { toast } from "sonner"

export function SaveButton({
    stacqId,
    isInitiallySaved
}: {
    stacqId: string,
    isInitiallySaved: boolean
}) {
    const { session, openAuthModal } = useAuth()
    const [isSaved, setIsSaved] = useState(isInitiallySaved)
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        if (!session) {
            openAuthModal('signup')
            return
        }
        
        // Optimistic Update
        const previousState = isSaved
        setIsSaved(!isSaved)
        
        const res = await toggleSaveCollection(stacqId)
        if (res.error) {
            setIsSaved(previousState)
            toast.error(res.error)
        } else {
            toast.success(isSaved ? "Saved to library" : "Removed from library")
        }
    }

    return (
        <button
            onClick={handleSave}
            className={cn(
                "inline-flex items-center justify-center w-10 h-10 rounded-full border transition-all active:scale-95 cursor-pointer",
                isSaved
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-background border-border text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-surface"
            )}
        >
            <Bookmark className={cn("w-5 h-5 transition-transform duration-200", isSaved && "fill-current scale-110")} />
        </button>
    )
}