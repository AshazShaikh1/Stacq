"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Quote, Trash2, Edit2, Loader2, Check } from "lucide-react"
import { deleteResource, updateResource } from "@/lib/actions/mutations"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Image from "next/image"

export function ResourceCard({ resource, isOwner = false }: { resource?: any, isOwner?: boolean }) {
    const router = useRouter()

    const item = resource || {
        id: "fallback",
        title: "Tailwind CSS Documentation",
        url: "https://tailwindcss.com",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
        note: "This is my go-to utility framework. Check out the typography plugin specifically for beautiful text defaults!"
    }

    const { id, title, url, thumbnail, note } = item;

    const [deleting, setDeleting] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({ title: title || "", note: note || "" })

    const getDomain = (link: string) => {
        try {
            return new URL(link).hostname.replace('www.', '')
        } catch {
            return link
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        const res = await deleteResource(id)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Resource deleted")
            router.refresh()
        }
        setDeleting(false)
    }

    const handleSave = async () => {
        setSaving(true)
        const res = await updateResource(id, formData)
        setSaving(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Resource updated")
            setOpenEdit(false)
            router.refresh()
        }
    }

    return (
        <div className="relative group bg-background hover:bg-surface border border-border hover:border-primary/30 rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md flex flex-col sm:flex-row active:scale-[0.99] sm:active:scale-100">
            <div className="w-full sm:w-36 md:w-44 shrink-0 aspect-video sm:aspect-square bg-surface border-b sm:border-b-0 sm:border-r border-border overflow-hidden relative">
                <Image
                    src={thumbnail || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop"}
                    alt={title || "Resource"}
                    fill
                    sizes="(max-width: 640px) 100vw, 176px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
            </div>

            <div className="flex flex-col flex-1 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                        <h3 className="font-extrabold text-lg md:text-xl text-foreground leading-tight line-clamp-2">
                            {title}
                        </h3>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 uppercase tracking-wider"
                        >
                            {getDomain(url)}
                            <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>

                    <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center h-9 sm:h-10 px-6 sm:px-8 text-xs sm:text-sm font-bold bg-background hover:bg-primary border border-border text-foreground hover:text-primary-foreground hover:border-primary shadow-sm transition-all rounded-full cursor-pointer"
                    >
                        Visit Link
                    </a>
                </div>

                <div className="mt-4 pt-4 border-t border-border relative">
                    <div className="flex gap-3 items-start">
                        <Quote className="w-4 h-4 text-primary shrink-0 mt-1 opacity-40" />
                        <p className="text-sm md:text-base text-foreground/70 leading-relaxed font-medium pr-10">
                            {note || "No curator note provided."}
                        </p>
                    </div>

                    {isOwner && (
                        <div className="absolute bottom-0 right-0 flex items-center gap-1 bg-background/80 backdrop-blur-sm pl-2 py-1 rounded-tl-xl transition-opacity opacity-100 md:opacity-0 group-hover:opacity-100">
                            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                                <DialogTrigger className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-colors cursor-pointer">
                                    <Edit2 className="w-4 h-4" />
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md rounded-3xl">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold">Edit Resource</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-primary tracking-widest">Title</label>
                                            <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="rounded-xl border-border bg-surface" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-primary tracking-widest">Curator's Note</label>
                                            <Textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="rounded-xl border-border bg-surface min-h-[100px]" />
                                        </div>
                                        <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl h-12 font-bold shadow-emerald shadow-sm">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />Save Changes</>}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <button onClick={handleDelete} disabled={deleting} className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer">
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}