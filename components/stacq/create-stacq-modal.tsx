"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createStacq } from "@/lib/actions/stacq"
import { Loader2, PlusSquare } from "lucide-react"

export function CreateStacqModal({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [category, setCategory] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const res = await createStacq(title, description, category)
        if (res.error) {
            setError(res.error)
            setLoading(false)
        } else if (res.success) {
            setOpen(false)
            setLoading(false)
            // Redirect smoothly to the brand new empty collection
            router.push(`/stacq/${res.stacqId}`)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="w-full bg-transparent border-none appearance-none p-0 text-left outline-none block cursor-pointer">
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-border">
                <DialogHeader className="space-y-2">
                    <DialogTitle className="text-2xl font-bold tracking-tight">Create a Collection</DialogTitle>
                    <DialogDescription>
                        Give your stack a title, a category tag, and explain why you're curating it.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {error && <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-xl border border-destructive/20">{error}</div>}
                    
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Title</label>
                        <Input 
                            value={title} 
                            onChange={(e) => setTitle(e.target.value)} 
                            placeholder="e.g. Next.js Mastery" 
                            required 
                            className="h-11 focus-visible:ring-primary focus-visible:border-primary border-slate-300"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Category</label>
                        <Input 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)} 
                            placeholder="e.g. Tech, Design, Productivity" 
                            required 
                            className="h-11 focus-visible:ring-primary focus-visible:border-primary border-slate-300"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Description (The "Why")</label>
                        <Textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="Why are you putting this collection together? What's the value?" 
                            required 
                            className="resize-none h-24 focus-visible:ring-primary focus-visible:border-primary border-slate-300"
                        />
                    </div>

                    <div className="pt-2">
                        <Button type="submit" disabled={loading} className="w-full h-12 rounded-full font-bold text-base bg-primary hover:bg-primary-dark shadow-emerald cursor-pointer transition-transform hover:scale-[1.02]">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <PlusSquare className="w-5 h-5 mr-2" />}
                            {loading ? "Creating..." : "Create Collection"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
