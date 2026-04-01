"use client"

import { useState } from "react"
import { Share, Check } from "lucide-react"

export function ShareButton({ username }: { username: string }) {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        try {
            // Generates absolute URL reliably matching the user's active window layout
            const url = `${window.location.origin}/${username}`
            await navigator.clipboard.writeText(url)
            
            setCopied(true)
            
            // Revert state elegantly after 2 seconds
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error("Failed to copy", err)
        }
    }

    return (
        <div 
            onClick={handleShare} 
            className="inline-flex items-center justify-center whitespace-nowrap w-full md:w-auto rounded-full px-8 h-12 text-base font-bold bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer select-none"
        >
            {copied ? <Check className="w-5 h-5 mr-2 text-emerald-500" /> : <Share className="w-5 h-5 mr-2" />}
            {copied ? "Link Copied!" : "Share My Library"}
        </div>
    )
}
