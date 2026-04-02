"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "../ui/textarea"
import { fetchMetadata, addResource } from "@/lib/actions/resource"
import { Loader2, Link as LinkIcon, AlertCircle, CheckCircle2 } from "lucide-react"
import { ResourceCard } from "./resource-card"
import { toast } from "sonner"

export function AddResourceForm({ stacqId }: { stacqId: string }) {
    const router = useRouter()
    const [url, setUrl] = useState("")
    const [note, setNote] = useState("")

    const [loadingMeta, setLoadingMeta] = useState(false)
    const [metadata, setMetadata] = useState<any>(null)
    const [metaError, setMetaError] = useState<string | null>(null)

    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    // Debounced Live Metadata Fetching
    useEffect(() => {
        const timer = setTimeout(async () => {
            // Only fetch if URL looks valid and has changed
            if (!url || !url.startsWith("http") || url.length < 10) {
                setMetadata(null)
                setMetaError(null)
                return;
            }

            // Don't refetch if we already have metadata for this exact URL
            if (metadata?.url === url) return;

            setLoadingMeta(true)
            setMetaError(null)
            setMetadata(null)

            try {
                const res = await fetchMetadata(url)
                if (res.error) {
                    setMetaError("No preview found, but you can still save.")
                } else {
                    setMetadata({ ...res, url }) // Store url in metadata to prevent loops
                }
            } catch (e) {
                setMetaError("Could not fetch preview.")
            } finally {
                setLoadingMeta(false)
            }
        }, 800) // 800ms debounce

        return () => clearTimeout(timer)
    }, [url])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url) return;

        setSaving(true)
        const res = await addResource(stacqId, url, note, metadata)
        setSaving(false)

        if (res.success) {
            toast.success("Resource added to collection!")
            setUrl("")
            setNote("")
            setMetadata(null)
            setSuccess(false)
            router.refresh()
        } else {
            toast.error(res.error || "Failed to add resource")
        }
    }

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6 shadow-sm">

            <h3 className="text-lg sm:text-xl font-bold mb-4 sm:mb-5 tracking-tight">
                Add to this Collection
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

                <div className="space-y-2">
                    <label className="text-xs sm:text-sm font-semibold text-foreground">
                        Resource Link
                    </label>

                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />

                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/article"
                            className="pl-10 h-10 sm:h-11 text-sm border-slate-300"
                            required
                            type="url"
                        />
                    </div>
                </div>

                {loadingMeta && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-600 animate-pulse font-medium bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scanning link for preview...
                    </div>
                )}

                {metaError && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <AlertCircle className="w-4 h-4" />
                        {metaError}
                    </div>
                )}

                {metadata && (
                    <div className="border-2 border-primary/20 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-primary/5 py-1 px-3 border-b border-primary/10 text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" />
                            Preview
                        </div>

                        <div className="p-3 bg-white pointer-events-none opacity-90">
                            <ResourceCard resource={{
                                title: metadata.title || url,
                                url: url,
                                thumbnail: metadata.image,
                                note: note || "Preview of your curator note"
                            }} />
                        </div>
                    </div>
                )}

                <div className="space-y-2 pt-1">
                    <label className="text-xs sm:text-sm font-semibold text-foreground">
                        Curator's Note
                    </label>

                    <Textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Why is this resource valuable?"
                        className="resize-none h-20 sm:h-24 text-sm border-slate-300"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={saving || !url}
                    className="w-full bg-primary hover:bg-primary-dark text-white rounded-full h-11 sm:h-12 text-sm sm:text-base"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Resource"}
                </Button>

            </form>
        </div>
    )
}
