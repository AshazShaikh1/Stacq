"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Github, Twitter, Globe, Plus, Check, Loader2, Edit2, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateProfile } from "@/lib/actions/profile"
import { toast } from "sonner"

interface SocialLink {
    label: string
    url: string
}

export function InlineSocialLinks({ profile, isOwnProfile }: { profile: any, isOwnProfile: boolean }) {

    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)

    const [links, setLinks] = useState<SocialLink[]>(
        Array.isArray(profile.social_links) ? profile.social_links : []
    )

    const addLinkRow = () => setLinks([...links, { label: "", url: "" }])

    const removeLinkRow = (index: number) => {
        setLinks(links.filter((_, i) => i !== index))
    }

    const updateLink = (index: number, field: keyof SocialLink, value: string) => {
        const newLinks = [...links]
        newLinks[index][field] = value
        setLinks(newLinks)
    }

    const isInvalid = links.some(l => !l.label.trim() || !l.url.trim())

    const handleSave = async () => {
        setLoading(true)

        const filteredLinks = links.filter(l => l.url.trim() !== "")
        const res = await updateProfile(profile.id, profile.username, {
            social_links: filteredLinks
        })

        setLoading(false)

        if (res.error) toast.error(res.error)
        else {
            toast.success("Profile updated!")
            setIsEditing(false)
            router.refresh()
        }
    }

    const getIcon = (label: string) => {
        const l = label.toLowerCase()
        if (l.includes('twitter') || l.includes('x')) return <Twitter className="w-5 h-5" />
        if (l.includes('github')) return <Github className="w-5 h-5" />
        return <Globe className="w-5 h-5" />
    }

    if (isEditing) {
        return (
            <div className="flex flex-col gap-3 pt-3 sm:pt-4 w-full max-w-md bg-surface p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border shadow-sm">

                <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider mb-2">
                    Stacqer Links
                </p>

                {links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">

                        <Input
                            placeholder="Platform"
                            value={link.label}
                            onChange={e => updateLink(index, 'label', e.target.value)}
                            className="h-9 sm:h-10 bg-background w-1/3 text-xs sm:text-sm"
                        />

                        <Input
                            placeholder="url.com/username"
                            value={link.url}
                            onChange={e => updateLink(index, 'url', e.target.value)}
                            className="h-9 sm:h-10 bg-background flex-1 text-xs sm:text-sm"
                        />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLinkRow(index)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>

                    </div>
                ))}

                <Button
                    variant="outline"
                    onClick={addLinkRow}
                    className="mt-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 rounded-xl text-sm"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Link
                </Button>

                <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border flex-wrap">

                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading || isInvalid}
                        className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-full px-5 sm:px-6 h-9 sm:h-10 font-bold shadow-emerald shadow-sm"
                    >
                        {loading
                            ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            : <Check className="w-4 h-4 mr-2" />
                        }
                        Save
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        className="rounded-full px-4 sm:px-5 h-9 sm:h-10 font-semibold text-muted-foreground hover:bg-surface-hover"
                    >
                        Cancel
                    </Button>

                </div>

            </div>
        )
    }

    return (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 group">

            {links.map((link, index) => (
                <a
                    key={index}
                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all bg-surface hover:bg-primary/5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-border hover:border-primary/30"
                >
                    {getIcon(link.label)}
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-tight">
                        {link.label || 'Link'}
                    </span>
                </a>
            ))}

            {links.length === 0 && isOwnProfile && (
                <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="rounded-full border-primary/30 text-primary hover:bg-primary/5 font-bold text-sm"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Social Links
                </Button>
            )}

            {links.length > 0 && isOwnProfile && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary p-2 rounded-full hover:bg-surface cursor-pointer"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            )}

            {links.length === 0 && !isOwnProfile && (
                <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                    No linked accounts
                </div>
            )}

        </div>
    )
}