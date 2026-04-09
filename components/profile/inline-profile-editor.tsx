"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateProfile } from "@/lib/actions/profile"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Edit2, Check, X, Loader2 } from "lucide-react"

export function InlineProfileEditor({ profile, isOwnProfile }: { profile: any, isOwnProfile: boolean }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        display_name: profile.display_name || "",
        username: profile.username || "",
        bio: profile.bio || ""
    })

    const handleSave = async () => {
        setLoading(true)
        setError(null)
        const res = await updateProfile(profile.id, profile.username, formData)
        setLoading(false)

        if (res.error) {
            setError(res.error)
        } else if (res.success) {
            if (res.newUsername && res.newUsername !== profile.username) {
                router.push(`/${res.newUsername}`)
            } else {
                setIsEditing(false)
                router.refresh()
            }
        }
    }

    const handleCancel = () => {
        setFormData({
            display_name: profile.display_name || "",
            username: profile.username || "",
            bio: profile.bio || ""
        })
        setError(null)
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="flex-1 space-y-3 sm:space-y-4 bg-surface p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border shadow-sm">

                {error && (
                    <div className="text-xs sm:text-sm text-destructive font-semibold bg-destructive/10 px-3 sm:px-4 py-2 rounded-xl border border-destructive/20">
                        {error}
                    </div>
                )}

                <div>
                    <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest mb-1 block">
                        Display Name
                    </label>

                    <Input
                        value={formData.display_name}
                        onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                        className="text-xl sm:text-2xl font-black h-12 sm:h-14 bg-background rounded-xl border-border"
                        placeholder="Your Name"
                    />
                </div>

                <div>
                    <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest mb-1 block">
                        Username
                    </label>

                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm sm:text-base">@</span>

                        <Input
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                            className="h-11 sm:h-12 bg-background rounded-xl pl-7 sm:pl-8 border-border lowercase font-semibold"
                            placeholder="username"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest mb-1 block">
                        Bio
                    </label>

                    <Textarea
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                        className="bg-background resize-none h-20 sm:h-24 rounded-xl border-border text-sm"
                        placeholder="A short description about yourself..."
                    />
                </div>

                <div className="flex items-center gap-2 sm:gap-3 pt-1 flex-wrap">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-5 sm:px-7 h-10 sm:h-11 text-sm sm:text-base font-bold shadow-emerald shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                        Save
                    </button>

                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-full px-5 sm:px-7 h-10 sm:h-11 text-sm sm:text-base font-bold text-muted-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4 mr-2" /> Cancel
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-3 sm:space-y-4 group relative">

            <div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-foreground">
                    {profile.display_name || profile.username}
                </h1>

                <p className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium mt-1">
                    @{profile.username}
                </p>
            </div>

            <p className="text-sm sm:text-base md:text-lg text-foreground/80 max-w-2xl leading-relaxed">
                {profile.bio || "This stacqer hasn't added a bio yet. They prefer to let their stacqs do the talking."}
            </p>

            {isOwnProfile && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="absolute -top-2 -right-2 md:opacity-0 group-hover:opacity-100 opacity-100 transition-all duration-200 p-2 text-muted-foreground hover:text-primary bg-background hover:bg-surface rounded-full shadow-sm hover:shadow-md border border-border hover:border-primary cursor-pointer z-10"
                    title="Edit Profile"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            )}

        </div>
    )
}