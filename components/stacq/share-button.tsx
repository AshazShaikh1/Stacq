"use client"

import { useState, useEffect } from "react"
import { Share2, Check, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ShareButton({ title, stacqId }: { title: string, stacqId: string }) {
    const [copied, setCopied] = useState(false)
    const [shareUrl, setShareUrl] = useState("")

    // 1. Only set the URL once the component mounts in the browser
    useEffect(() => {
        setShareUrl(`${window.location.origin}/stacq/${stacqId}`)
    }, [stacqId])

    const handleShare = async () => {
        // Guard clause in case it's clicked before URL is set
        if (!shareUrl) return

        // 2. Try Native Share (Mobile / Safari)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Check out this Stacq: ${title}`,
                    url: shareUrl,
                })
                return
            } catch (err) {
                
            }
        }

        // 3. Fallback: Copy to Clipboard
        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            toast.error("Could not copy link. Please copy the URL from your browser address bar.")
        }
    }

    return (
        <Button
            variant="outline"
            onClick={handleShare}
            className={cn(
                "rounded-full px-6 h-12 font-bold transition-all active:scale-95 border-slate-200 hover:border-primary hover:text-primary shrink-0",
                copied && "border-primary text-primary bg-primary/5"
            )}
        >
            {copied ? (
                <><Check className="w-4 h-4 mr-2" /> Copied!</>
            ) : (
                <><Share2 className="w-4 h-4 mr-2" /> Share</>
            )}
        </Button>
    )
}