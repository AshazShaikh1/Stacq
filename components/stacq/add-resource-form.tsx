"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "../ui/textarea"
import { fetchMetadata, addResource } from "@/lib/actions/resource"
import { Loader2, Link as LinkIcon, AlertCircle, CheckCircle2 } from "lucide-react"
import { ResourceCard } from "./resource-card"

export function AddResourceForm({ stacqId }: { stacqId: string }) {
    const [url, setUrl] = useState("")
    const [note, setNote] = useState("")

    const [loadingMeta, setLoadingMeta] = useState(false)
    const [metadata, setMetadata] = useState<any>(null)
    const [metaError, setMetaError] = useState<string | null>(null)

    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    // Trigger metadata fetch automatically when user loses focus of the URL box
    const handleUrlBlur = async () => {
        if (!url || !url.startsWith("http")) return;

        // Reset state for new fetch
        setLoadingMeta(true)
        setMetaError(null)
        setMetadata(null)
        setSuccess(false)

        try {
            const res = await fetchMetadata(url)
            if (res.error) {
                setMetaError("Could not render a preview, but you can still completely save this link.")
            } else {
                setMetadata(res)
            }
        } catch (e) {
            setMetaError("Could not fetch preview.")
        } finally {
            setLoadingMeta(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!url) return;

        setSaving(true)
        const res = await addResource(stacqId, url, note, metadata)
        setSaving(false)

        if (res.success) {
            setSuccess(true)
            setUrl("")
            setNote("")
            setMetadata(null)
        } else {
            setMetaError(`DB Error: ${res.error || "Unknown server response."}`)
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-5 tracking-tight">Add to this Collection</h3>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Resource Link</label>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onBlur={handleUrlBlur}
                            placeholder="https://example.com/article"
                            className="pl-10 h-11 focus-visible:ring-primary focus-visible:border-primary border-slate-300"
                            required
                            type="url"
                        />
                    </div>
                </div>

                {loadingMeta && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 animate-pulse font-medium bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scanning link for OpenGraph preview...
                    </div>
                )}

                {metaError && (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {metaError}
                    </div>
                )}

                {metadata && (
                    <div className="border-2 border-primary/20 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-primary/5 py-1.5 px-3 border-b border-primary/10 text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" /> Preview Rendered
                        </div>
                        <div className="p-3 bg-white pointer-events-none opacity-90">
                            <ResourceCard resource={{
                                title: metadata.title || url,
                                url: url,
                                thumbnail: metadata.image,
                                note: note || "Adding a custom curator note will look like this!"
                            }} />
                        </div>
                    </div>
                )}

                <div className="space-y-2 pt-2">
                    <label className="text-sm font-semibold text-foreground">Curator's Note (Optional)</label>
                    <Textarea
                        value={note}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                        placeholder="Why is this resource valuable? Add your human perspective here..."
                        className="resize-none h-24 focus-visible:ring-primary focus-visible:border-primary border-slate-300"
                    />
                </div>

                <div className="pt-2">
                    <Button
                        type="submit"
                        disabled={saving || !url}
                        className="w-full bg-primary hover:bg-primary-dark text-white shadow-emerald rounded-full h-12 font-semibold text-base transition-all duration-300 cursor-pointer"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : success ? <span className="flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> Resource Saved</span> : "Save Resource"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
