"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Quote, Trash2, Edit2, Loader2, Check, X } from "lucide-react"
import { deleteResource, updateResource } from "@/lib/actions/mutations"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "@/components/ui/image-upload"
import { toast } from "sonner"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PlusSquare } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function ResourceCard({ resource, isOwner = false, availableSections = ["Default"] }: { resource?: any, isOwner?: boolean, availableSections?: string[] }) {
    const router = useRouter()

    const item = resource || {
        id: "fallback",
        title: "Tailwind CSS Documentation",
        url: "https://tailwindcss.com",
        thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop",
        note: "This is my go-to utility framework. Check out the typography plugin specifically for beautiful text defaults!"
    }

    const { id, title, url, thumbnail, note, section } = item;

    const [deleting, setDeleting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [openEdit, setOpenEdit] = useState(false)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        title: title || "",
        note: note || "",
        thumbnail: thumbnail || "",
        section: section || "Default"
    })
    const [isCreatingSection, setIsCreatingSection] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const isLongNote = note && note.length > 150

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
            setDeleting(false)
        } else {
            toast.success("Resource deleted")
            setIsDeleteDialogOpen(false)
            router.refresh()
        }
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
                        className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center h-11 sm:h-12 px-8 sm:px-10 text-sm sm:text-base font-bold bg-background hover:bg-primary border border-border text-foreground hover:text-primary-foreground hover:border-primary shadow-sm transition-all rounded-full cursor-pointer"
                    >
                        Visit Link
                    </a>
                </div>

                <div className="mt-4 pt-4 border-t border-border relative">
                    <div className="flex gap-3 items-start">
                        <Quote className="w-4 h-4 text-primary shrink-0 mt-1 opacity-40" />
                        <div className="flex-1">
                            <p className={`text-sm md:text-base text-foreground/70 leading-relaxed font-medium pr-10 whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}>
                                {note || "No curator note provided."}
                            </p>
                            {isLongNote && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-xs font-bold text-primary hover:underline mt-1 cursor-pointer"
                                >
                                    {isExpanded ? "Show Less" : "Read More"}
                                </button>
                            )}
                        </div>
                    </div>

                    {isOwner && (
                        <div className="absolute bottom-0 right-0 flex items-center gap-1 bg-background/80 backdrop-blur-sm pl-2 py-1 rounded-tl-xl transition-opacity opacity-100 md:opacity-0 group-hover:opacity-100">
                            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                                <DialogTrigger className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-colors cursor-pointer">
                                    <Edit2 className="w-4 h-4" />
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-2xl rounded-3xl p-6 sm:p-8">
                                    <DialogHeader>
                                        <DialogTitle className="text-2xl font-black tracking-tight mb-4">Edit Resource</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest mb-1.5 block">Resource Title</label>
                                                <Input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="h-11 sm:h-12 text-base font-bold bg-background rounded-xl" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest mb-1.5 block">Stacqer's Note</label>
                                                <Textarea value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} className="h-24 sm:h-28 bg-background resize-none rounded-xl text-sm" placeholder="Why is this resource high-signal?" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] sm:text-xs font-bold uppercase text-primary tracking-widest">Section (Optional)</label>
                                                {isCreatingSection ? (
                                                    <div className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                                                        <Input
                                                            value={formData.section === "Default" ? "" : formData.section}
                                                            onChange={e => setFormData({ ...formData, section: e.target.value })}
                                                            placeholder="New section name"
                                                            className="h-12 rounded-xl border-border bg-surface font-bold flex-1"
                                                            autoFocus
                                                        />
                                                        <Button type="button" onClick={() => { setIsCreatingSection(false); setFormData({ ...formData, section: section || "Default" }); }} variant="outline" className="h-12 w-12 rounded-xl text-muted-foreground p-0 hover:bg-destructive/5 hover:text-destructive">
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Select
                                                        value={formData.section}
                                                        onValueChange={(val) => {
                                                            if (val === "new-section") {
                                                                setIsCreatingSection(true);
                                                                setFormData({ ...formData, section: "" });
                                                            } else {
                                                                setFormData({ ...formData, section: val });
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="w-full h-12 bg-surface border-border rounded-xl text-sm font-bold px-4 hover:border-primary/30 transition-all">
                                                            <SelectValue placeholder="Select a section" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-border shadow-2xl">
                                                            {availableSections.map((sec) => (
                                                                <SelectItem key={sec} value={sec} className="font-bold py-2.5">
                                                                    {sec.length > 25 ? sec.substring(0, 25) + "..." : sec}
                                                                </SelectItem>
                                                            ))}
                                                            <SelectItem value="new-section" className="text-primary font-black py-2.5 border-t border-border/50 mt-1">
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
                                        <div className="space-y-2">
                                            <ImageUpload
                                                value={formData.thumbnail}
                                                onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                                                onRemove={() => setFormData({ ...formData, thumbnail: "" })}
                                                label="Resource Thumbnail"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-border mt-6">
                                        <Button onClick={handleSave} disabled={saving} className="w-full bg-primary hover:bg-primary-dark text-primary-foreground rounded-full h-14 font-black shadow-emerald shadow-lg active:scale-95 transition-transform">
                                            {saving ? (
                                                <div className="flex items-center gap-3">
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Saving...
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <Check className="w-5 h-5" />
                                                    Save Changes
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                <AlertDialogTrigger className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer outline-none">
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl max-w-[90vw] sm:max-w-md">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this resource from the stacq.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
