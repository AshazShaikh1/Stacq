"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Quote, Trash2, Edit2, Loader2, Check } from "lucide-react"
import { deleteResource, updateResource } from "@/lib/actions/mutations"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export interface ResourceItem {
    id: string;
    title: string;
    url: string;
    thumbnail?: string;
    note?: string;
}

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
        if (!confirm("Are you sure you want to completely delete this link resource?")) return
        setDeleting(true)
        const res = await deleteResource(id)
        if (res.error) alert(res.error)
        setDeleting(false)
        router.refresh()
    }

    const handleSave = async () => {
        setSaving(true)
        const res = await updateResource(id, formData)
        setSaving(false)
        if (res.error) {
            alert(res.error)
        } else {
            setOpenEdit(false)
            router.refresh()
        }
    }

    return (
        <div className="relative group bg-white hover:bg-emerald-50/30 border border-slate-200 hover:border-emerald-200 rounded-3xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md flex flex-col sm:flex-row">
            <div className="w-full sm:w-40 md:w-48 shrink-0 aspect-video sm:aspect-square bg-slate-100 border-b sm:border-b-0 sm:border-r border-slate-200 overflow-hidden relative">
                <img 
                    src={thumbnail}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>

            <div className="flex flex-col flex-1 p-5 sm:p-6 pb-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
                    <div className="space-y-1.5 flex-1 pr-12">
                        <h3 className="font-bold text-lg md:text-xl text-slate-800 leading-tight line-clamp-1">{title}</h3>
                        <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors line-clamp-1 inline-flex items-center gap-1.5 px-1 py-0.5 -ml-1 rounded-md"
                        >
                            {getDomain(url)}
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                    
                    <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center h-10 px-8 text-sm font-bold bg-white hover:bg-emerald-600 border border-slate-200 text-slate-700 hover:text-white hover:border-emerald-600 shadow-sm transition-all rounded-full cursor-pointer"
                    >
                        Visit
                    </a>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100">
                    <div className="flex gap-3 items-start p-1.5">
                        <Quote className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 fill-emerald-50" />
                        <p className="text-sm md:text-base italic text-slate-600 leading-relaxed font-medium">
                            {note || "No curator note provided."}
                        </p>
                    </div>
                </div>
            </div>

            {isOwner && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-slate-200 z-10">
                    <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                        <DialogTrigger asChild>
                            <button className="p-2 text-slate-400 hover:text-emerald-600 rounded-full hover:bg-emerald-50 transition-colors cursor-pointer outline-none">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md border-slate-100 shadow-xl rounded-3xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black tracking-tight">Edit Resource</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-3">
                                <div>
                                    <label className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">Display Title</label>
                                    <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-12 mt-1 bg-slate-50 font-medium" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">Curator's Note</label>
                                    <Textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="resize-none h-32 mt-1 bg-slate-50 font-medium leading-relaxed" />
                                </div>
                                <Button onClick={handleSave} disabled={saving} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold h-12 shadow-sm transition-transform hover:scale-[1.02] mt-2">
                                    {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <><Check className="w-5 h-5 mr-2" /> Save Updates</>}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className="w-px h-5 bg-slate-200 hidden sm:block"></div>

                    <button onClick={handleDelete} disabled={deleting} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors cursor-pointer outline-none md:mr-0 mr-1">
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                </div>
            )}
        </div>
    )
}
