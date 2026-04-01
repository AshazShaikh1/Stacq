"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createStacq } from "@/lib/actions/stacq"
import { Loader2, PlusSquare } from "lucide-react"
import { toast } from "sonner"

export function CreateStacqModal({ children }: { children: React.ReactElement }) {
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

        const res = await createStacq(title, description, category)
        if (res.error) {
            toast.error(res.error)
            setLoading(false)
        } else if (res.success) {
            toast.success("Collection created successfully!")
            setOpen(false)
            setLoading(false)
            router.push(`/stacq/${res.stacqId}`)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={children} />

            <DialogContent className="w-[95%] sm:max-w-md border-border">

                <DialogHeader className="space-y-1.5 sm:space-y-2">

                    <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                        Create a Collection
                    </DialogTitle>

                    <DialogDescription className="text-sm">
                        Give your stack a title, a category tag, and explain why you're curating it.
                    </DialogDescription>

                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pt-2">

                    <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-semibold text-foreground">
                            Title
                        </label>

                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Next.js Mastery"
                            required
                            className="h-10 sm:h-11 text-sm focus-visible:ring-primary focus-visible:border-primary border-border"
                        />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-semibold text-foreground">
                            Category
                        </label>

                        <Input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. Tech, Design, Productivity"
                            required
                            className="h-10 sm:h-11 text-sm focus-visible:ring-primary focus-visible:border-primary border-border"
                        />
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                        <label className="text-xs sm:text-sm font-semibold text-foreground">
                            Description (The "Why")
                        </label>

                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Why are you putting this collection together? What's the value?"
                            required
                            className="resize-none h-20 sm:h-24 text-sm focus-visible:ring-primary focus-visible:border-primary border-border"
                        />
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 sm:h-12 rounded-full font-bold text-sm sm:text-base bg-primary hover:bg-primary-dark shadow-emerald cursor-pointer transition-transform hover:scale-[1.02]"
                        >
                            {loading
                                ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                                : <PlusSquare className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                            }

                            {loading ? "Creating..." : "Create Collection"}
                        </Button>
                    </div>

                </form>
            </DialogContent>
        </Dialog>
    )
}