"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "../ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { fetchMetadata, addResource } from "@/lib/actions/resource"
import { resourceSchema } from "@/lib/validations/schemas"
import { Loader2, Link as LinkIcon, AlertCircle, CheckCircle2, Type, X, PlusSquare } from "lucide-react"

import { ResourceCard } from "./resource-card"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function AddResourceForm({ stacqId, availableSections = ["Default"], onSuccess }: { stacqId: string, availableSections?: string[], onSuccess?: () => void }) {
    const router = useRouter()
    const [url, setUrl] = useState("")
    const [title, setTitle] = useState("")
    const [thumbnail, setThumbnail] = useState("")
    const [note, setNote] = useState("")
    const [section, setSection] = useState(availableSections[0] || "Default")
    const [isCreatingSection, setIsCreatingSection] = useState(false)

    const [loadingMeta, setLoadingMeta] = useState(false)
    const [metadata, setMetadata] = useState<any>(null)
    const [metaError, setMetaError] = useState<string | null>(null)

    const [errors, setErrors] = useState<Record<string, string>>({})
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

    const validate = () => {
        const result = resourceSchema.safeParse({ url, title, thumbnail, note, section })
        if (!result.success) {
            const newErrors: Record<string, string> = {}
            result.error.issues.forEach((err: any) => {
                const path = err.path[0] as string
                newErrors[path] = err.message
            })
            setErrors(newErrors)
            return false
        }
        setErrors({})
        return true
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setSaving(true)
        const res = await addResource(stacqId, url, note, title, thumbnail, section)
        setSaving(false)

        if (res.success) {
            toast.success("Added to Stacq")
            setUrl("")
            setTitle("")
            setThumbnail("")
            setNote("")
            setSection("Default")
            setIsCreatingSection(false)
            setMetadata(null)
            setErrors({})
            if (onSuccess) onSuccess();
            router.refresh()
        } else {
            toast.error(res.error || "Failed to add resource")
        }
    }

    return (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-7 shadow-sm">

            <div className="flex items-center gap-3 mb-4 sm:mb-8">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black shadow-sm text-sm sm:text-base">
                    +
                </div>
                <div>
                    <h3 className="text-lg sm:text-2xl font-black tracking-tight text-foreground leading-tight">
                        Add to Collection
                    </h3>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">


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
                                className={`pl-10 h-12 bg-surface rounded-xl border-border focus:ring-primary/20 text-sm sm:text-base font-medium ${errors.url ? 'border-destructive' : ''}`}
                            />
                        </div>
                        {errors.url && <p className="text-[10px] font-bold text-destructive animate-in fade-in slide-in-from-top-1">{errors.url}</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest block">
                            Section (Optional)
                        </label>
                        {isCreatingSection ? (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                <Input
                                    value={section === "Default" ? "" : section}
                                    onChange={(e) => setSection(e.target.value)}
                                    placeholder="Enter new section name"
                                    className="h-12 bg-surface rounded-xl border-border focus:ring-primary/20 text-sm font-bold flex-1"
                                    autoFocus
                                />
                                <Button type="button" onClick={() => { setIsCreatingSection(false); setSection("Default"); }} variant="outline" className="h-12 w-12 rounded-xl text-muted-foreground p-0 hover:bg-destructive/5 hover:text-destructive transition-colors">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <Select 
                                value={section} 
                                onValueChange={(val) => {
                                    if (!val) return;
                                    if (val === "new-section") {
                                        setIsCreatingSection(true);
                                        setSection("");
                                    } else {
                                        setSection(val);
                                    }
                                }}
                            >
                                <SelectTrigger className="w-full h-12 bg-surface border-border rounded-xl text-sm px-4 hover:border-primary/30 transition-all font-medium">
                                    <SelectValue placeholder="Select a section" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border shadow-2xl">
                                    {availableSections.map((sec) => (
                                        <SelectItem key={sec} value={sec} className="py-2.5">
                                            {sec.length > 25 ? sec.substring(0, 25) + "..." : sec}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="new-section" className="text-primary py-2.5 border-t border-border/50 mt-1 font-bold">
                                        <div className="flex items-center gap-2">
                                            <PlusSquare className="w-4 h-4" />
                                            + Add New Section
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
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
                                        className={`pl-10 h-11 bg-surface rounded-xl border-border text-sm font-semibold ${errors.title ? 'border-destructive' : ''}`}
                                    />
                                </div>
                                {errors.title && <p className="text-[10px] font-bold text-destructive animate-in fade-in slide-in-from-top-1">{errors.title}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest block">
                                    Curator's Note
                                </label>
                                <Textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Why is this valuable? Share your perspective..."
                                    className={`resize-none h-24 sm:h-28 text-sm border-border bg-surface rounded-xl p-4 font-medium ${errors.note ? 'border-destructive' : ''}`}
                                />
                                {errors.note && <p className="text-[10px] font-bold text-destructive animate-in fade-in slide-in-from-top-1">{errors.note}</p>}
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
