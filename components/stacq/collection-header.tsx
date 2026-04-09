"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateCollection, deleteCollection } from "@/lib/actions/mutations"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ImageUpload } from "@/components/ui/image-upload"
import { Loader2, Edit2, Check, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
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

export function CollectionHeader({ stacq, isOwner }: { stacq: any, isOwner: boolean }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: stacq.title || "",
        category: stacq.category || "",
        description: stacq.description || "",
        thumbnail: stacq.thumbnail || ""
    })
    const [deleting, setDeleting] = useState(false)

    const handleSave = async () => {
        setLoading(true)
        const res = await updateCollection(stacq.id, formData)
        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Collection updated")
            setIsEditing(false)
            router.refresh()
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        const res = await deleteCollection(stacq.id)
        if (res.error) {
            toast.error(res.error)
            setDeleting(false)
        } else {
            toast.success("Collection deleted")
            // Navigation to home is handled by revalidatePath in mutation or router push
            router.push('/')
        }
    }

    if (isEditing) {
        return (
            <div className="mb-10 relative bg-surface p-6 md:p-8 rounded-3xl border border-border shadow-sm w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-primary uppercase tracking-widest mb-1.5 block">Category Tag</label>
                            <Input
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="bg-background font-semibold text-primary max-w-xs h-12 rounded-xl"
                                placeholder="e.g. Frontend"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-primary uppercase tracking-widest mb-1.5 block">Collection Title</label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="text-2xl md:text-3xl font-black h-16 bg-background rounded-xl"
                                placeholder="Awesome Links"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-primary uppercase tracking-widest mb-1.5 block">Curator's Description</label>
                            <Textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="bg-background resize-none h-28 rounded-xl"
                                placeholder="Why did you curate this collection?"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <ImageUpload 
                            value={formData.thumbnail}
                            onChange={(url) => setFormData({ ...formData, thumbnail: url })}
                            onRemove={() => setFormData({ ...formData, thumbnail: "" })}
                            label="Collection Thumbnail"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-border mt-6">
                    <button onClick={handleSave} disabled={loading} className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-8 h-12 font-bold shadow-emerald shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer">
                        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Check className="w-5 h-5 mr-2" />} Save Changes
                    </button>
                    <button onClick={() => setIsEditing(false)} disabled={loading} className="inline-flex items-center justify-center rounded-full px-8 h-12 font-bold text-muted-foreground hover:bg-surface-hover transition-colors cursor-pointer">
                        <X className="w-5 h-5 mr-2" /> Cancel
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="mb-10 relative group inline-block w-full transition-all">
            <div className="text-center md:text-left">
                <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20 px-3 py-1 font-extrabold tracking-tight">
                    # {stacq.category || "Uncategorized"}
                </Badge>

                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-foreground leading-tight">
                    {stacq.title}
                </h1>

                {stacq.description && (
                    <div className="bg-primary/5 py-4 px-6 md:py-6 md:px-8 rounded-2xl md:rounded-3xl border-l-[6px] border-primary inline-block text-left shadow-sm max-w-3xl">
                        <p className="text-lg md:text-xl italic text-foreground/80 font-medium leading-relaxed">
                            "{stacq.description}"
                        </p>
                    </div>
                )}
            </div>

            {isOwner && (
                <div className="absolute -top-4 -right-2 md:top-0 md:-right-16 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col gap-2 z-10">
                    <button onClick={() => setIsEditing(true)} className="p-3 text-muted-foreground hover:text-primary bg-background hover:bg-surface rounded-full shadow-sm hover:shadow-md border border-border hover:border-primary cursor-pointer">
                        <Edit2 className="w-5 h-5" />
                    </button>
                    <AlertDialog>
                        <AlertDialogTrigger className="p-3 text-muted-foreground hover:text-destructive bg-background hover:bg-destructive/10 rounded-full shadow-sm hover:shadow-md border border-border cursor-pointer">
                            {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this collection and all of its resources? This action cannot be undone.
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
    )
}
