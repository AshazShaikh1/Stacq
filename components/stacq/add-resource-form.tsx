"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "../ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { fetchMetadata, addResource } from "@/lib/actions/resource"
import { Loader2, Link as LinkIcon, AlertCircle, CheckCircle2, Type, X } from "lucide-react"
import { ResourceCard } from "./resource-card"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export function AddResourceForm({ stacqId, availableSections = ["Default"] }: { stacqId: string, availableSections?: string[] }) {
    const router = useRouter()
    const [url, setUrl] = useState("")
    const [title, setTitle] = useState("")
    const [thumbnail, setThumbnail] = useState("")
    const [note, setNote] = useState("")
    const [section, setSection] = useState("Default")
    const [isCreatingSection, setIsCreatingSection] = useState(false)

    const [loadingMeta, setLoadingMeta] = useState(false)
    const [metadata, setMetadata] = useState<any>(null)
    const [metaError, setMetaError] = useState<string | null>(null)

    const [saving, setSaving] = useState(false)

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
                    setMetadata({ ...res, url })
                    setTitle(res.title || "")
                    setThumbnail(res.image || "")
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
        const res = await addResource(stacqId, url, note, title, thumbnail, section)
        setSaving(false)

        if (res.success) {
            toast.success("Resource added to collection!")
            setUrl("")
            setTitle("")
            setThumbnail("")
            setNote("")
            setSection("Default")
            setIsCreatingSection(false)
            setMetadata(null)
            router.refresh()
        } else {
            toast.error(res.error || "Failed to add resource")
        }
    }

    return (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-border p-5 sm:p-7 shadow-sm">

            <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black shadow-sm">
                    +
                </div>
                <div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight">
                        Add to Collection
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">
                        Expand your stack with high-signal content.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest block">
                            Resource Link
                        </label>

                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com/article"
                                className="pl-10 h-12 bg-surface rounded-xl border-border focus:ring-primary/20 text-sm sm:text-base font-medium"
                                required
                                type="url"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest block">
                            Section (Optional)
                        </label>
                        {isCreatingSection ? (
                            <div className="flex gap-2">
                                <Input
                                    value={section === "Default" ? "" : section}
                                    onChange={(e) => setSection(e.target.value)}
                                    placeholder="New section name"
                                    className="h-12 bg-surface rounded-xl border-border focus:ring-primary/20 text-sm font-medium flex-1"
                                    autoFocus
                                />
                                <Button type="button" onClick={() => { setIsCreatingSection(false); setSection("Default"); }} variant="outline" className="h-12 w-12 rounded-xl text-muted-foreground p-0">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {availableSections.map((sec) => (
                                    <Badge 
                                        key={sec} 
                                        onClick={() => setSection(sec)}
                                        className={`px-4 py-2 cursor-pointer text-sm select-none border border-border shadow-none font-bold rounded-lg ${section === sec ? 'bg-primary text-primary-foreground hover:bg-primary-dark shadow-sm scale-[1.02] transform transition-all border-primary/50' : 'bg-surface hover:bg-surface-hover hover:border-primary/30 text-muted-foreground'}`}
                                    >
                                        {sec}
                                    </Badge>
                                ))}
                                <Badge 
                                    onClick={() => { setIsCreatingSection(true); setSection(""); }}
                                    className="px-4 py-2 cursor-pointer text-sm select-none border border-dashed text-primary border-primary/40 bg-primary/5 hover:bg-primary/10 shadow-none font-bold rounded-lg"
                                >
                                    <Type className="w-3 h-3 mr-1" /> New Section
                                </Badge>
                            </div>
                        )}
                    </div>
                </div>

                {loadingMeta && (
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-primary animate-pulse font-black bg-primary/5 p-4 rounded-xl border border-primary/10">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scanning signal for preview...
                    </div>
                )}

                {metaError && (
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-amber-700 bg-amber-50 p-4 rounded-xl border border-amber-200 font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {metaError}
                    </div>
                )}

                {(metadata || url.length > 10) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest block">
                                    Display Title
                                </label>
                                <div className="relative">
                                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Title of this resource"
                                        className="pl-10 h-11 bg-surface rounded-xl border-border text-sm font-semibold"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest block">
                                    Curator's Note
                                </label>
                                <Textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Why is this valuable? Share your perspective..."
                                    className="resize-none h-24 sm:h-28 text-sm border-border bg-surface rounded-xl p-4 font-medium"
                                />
                            </div>
                        </div>

                        <ImageUpload
                            value={thumbnail}
                            onChange={setThumbnail}
                            onRemove={() => setThumbnail("")}
                            label="Resource Thumbnail"
                        />
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={saving || !url}
                    className="btn-primary w-full h-14 rounded-full font-black text-base sm:text-lg shadow-emerald shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                >
                    {saving ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            Curating...
                        </div>
                    ) : (
                        "Save to Stack"
                    )}
                </Button>

            </form>
        </div>
    )
}
