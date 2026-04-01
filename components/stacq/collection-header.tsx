"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateCollection } from "@/lib/actions/mutations"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Edit2, Check, X } from "lucide-react"

export function CollectionHeader({ stacq, isOwner }: { stacq: any, isOwner: boolean }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: stacq.title || "",
        category: stacq.category || "",
        description: stacq.description || ""
    })

    const handleSave = async () => {
        setLoading(true)
        const res = await updateCollection(stacq.id, formData)
        setLoading(false)
        if (res.error) {
            alert(res.error)
        } else {
            setIsEditing(false)
            router.refresh()
        }
    }

    if (isEditing) {
        return (
            <div className="mb-10 relative bg-emerald-50/30 p-6 md:p-8 rounded-3xl border border-emerald-100 shadow-sm w-full mx-auto md:mx-0">
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5 block">Category Tag</label>
                        <Input 
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value})}
                            className="bg-white font-semibold text-primary max-w-xs h-12 rounded-xl"
                            placeholder="e.g. Frontend"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5 block">Collection Title</label>
                        <Input 
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            className="text-2xl md:text-3xl font-black h-16 bg-white rounded-xl"
                            placeholder="Awesome Links"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1.5 block">Curator's Description</label>
                        <Textarea 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="bg-white resize-none h-28 rounded-xl"
                            placeholder="Why did you essentially assemble this exact collection array?"
                        />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-3">
                        <button onClick={handleSave} disabled={loading} className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-8 h-12 font-bold shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
                            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Check className="w-5 h-5 mr-2" />} Save Changes
                        </button>
                        <button onClick={() => setIsEditing(false)} disabled={loading} className="inline-flex items-center justify-center rounded-full px-8 h-12 font-bold text-slate-500 hover:bg-slate-200 transition-colors">
                            <X className="w-5 h-5 mr-2" /> Cancel
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mb-10 relative group inline-block w-full mx-auto md:mx-0 transition-all">
            <div className="text-center md:text-left">
                <Badge variant="outline" className="mb-4 bg-primary/10 text-primary border-primary/20 px-3 py-1 font-extrabold tracking-tight">
                    # {stacq.category || "Uncategorized"}
                </Badge>
                
                <h1 className="text-4xl md:text-5xl lg:text-5xl font-black tracking-tight mb-5 text-foreground leading-tight">
                    {stacq.title}
                </h1>
                
                {stacq.description && (
                    <div className="bg-emerald-50/50 py-4 px-6 md:py-6 md:px-8 rounded-2xl md:rounded-3xl border-l-[6px] border-emerald-500 inline-block text-left shadow-sm max-w-3xl">
                        <p className="text-lg md:text-xl italic text-emerald-900 font-medium leading-relaxed">
                            "{stacq.description}"
                        </p>
                    </div>
                )}
            </div>

            {/* Absolute hovering modification logic natively positioned over standard text blocks securely */}
            {isOwner && (
                <button onClick={() => setIsEditing(true)} className="absolute -top-4 -right-2 md:top-0 md:-right-16 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 p-3 text-slate-400 hover:text-emerald-600 bg-white hover:bg-emerald-50 rounded-full shadow-sm hover:shadow-md border border-slate-100 hover:border-emerald-100 cursor-pointer z-10">
                    <Edit2 className="w-5 h-5" />
                </button>
            )}
        </div>
    )
}
