"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateProfile } from "@/lib/actions/profile"
import { Loader2, Save } from "lucide-react"

export function EditProfileModal({ profile, children }: { profile: any, children: React.ReactNode }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form state initialized identically with active Database properties, decoupled from social links natively
    const [formData, setFormData] = useState({
        display_name: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const res = await updateProfile(profile.id, profile.username, formData)

        if (res.error) {
            setError(res.error)
            setLoading(false)
        } else if (res.success) {
            setLoading(false)

            // If the user changed their handle, we must forcefully redirect to the new URL route
            if (res.newUsername && res.newUsername !== profile.username) {
                router.push(`/${res.newUsername}`)
            } else {
                // Otherwise gracefully refresh the active layout payloads
                setOpen(false)
                router.refresh()
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className="w-full text-left outline-none appearance-none bg-transparent border-none p-0 inline-flex">
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-border">
                <DialogHeader className="space-y-1">
                    <DialogTitle className="text-2xl font-black tracking-tight">Edit Profile</DialogTitle>
                    <DialogDescription>Update your personal details and biography.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {error && <div className="p-3 text-sm bg-destructive/10 text-destructive font-medium rounded-xl">{error}</div>}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Display Name</label>
                        <Input name="display_name" value={formData.display_name} onChange={handleChange} placeholder="e.g. Ashaz Shaikh" className="h-11" required />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Username <span className="text-red-500">*</span></label>
                        <Input name="username" value={formData.username} onChange={handleChange} required className="lowercase h-11" placeholder="e.g. ashaz1" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Bio</label>
                        <Textarea name="bio" value={formData.bio} onChange={handleChange} className="resize-none h-20" placeholder="A short description about who you are and what you curate..." />
                    </div>

                    <div className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-dark text-white font-bold rounded-full h-12 shadow-sm shadow-emerald transition-transform hover:scale-[1.02]">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
