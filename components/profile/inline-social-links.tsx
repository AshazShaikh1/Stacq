"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Github, Twitter, Globe, Plus, Check, Loader2, Edit2, Trash2, Link as LinkIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateProfile } from "@/lib/actions/profile"

interface SocialLink {
    label: string;
    url: string;
}

export function InlineSocialLinks({ profile, isOwnProfile }: { profile: any, isOwnProfile: boolean }) {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)

    // Initialize from the new JSONB column (fallback to empty array)
    const [links, setLinks] = useState<SocialLink[]>(
        Array.isArray(profile.social_links) ? profile.social_links : []
    )

    const addLinkRow = () => {
        setLinks([...links, { label: "", url: "" }])
    }

    const handleEdit = () => {
        setLinks(Array.isArray(profile.social_links) ? profile.social_links : [])
        setIsEditing(true)
    }

    const handleCancel = () => {
        setLinks(Array.isArray(profile.social_links) ? profile.social_links : [])
        setIsEditing(false)
    }

    const removeLinkRow = (index: number) => {
        setLinks(links.filter((_, i) => i !== index))
    }

    const updateLink = (index: number, field: keyof SocialLink, value: string) => {
        const newLinks = [...links]
        newLinks[index][field] = value
        setLinks(newLinks)
    }

    // Safety constraint locking the submit trigger if any row has missing pairs
    const isInvalid = links.some(l => !l.label.trim() || !l.url.trim())

    const handleSave = async () => {
        setLoading(true)
        // Clean up empty rows before saving
        const filteredLinks = links.filter(l => l.url.trim() !== "")

        const res = await updateProfile(profile.id, profile.username, {
            social_links: filteredLinks
        })

        setLoading(false)
        if (res.error) {
            alert(res.error)
        } else {
            setIsEditing(false)
            router.refresh()
        }
    }

    // Helper to get Icon based on label
    const getIcon = (label: string) => {
        const l = label.toLowerCase()
        if (l.includes('twitter') || l.includes(' x ')) return <Twitter className="w-5 h-5" />
        if (l.includes('github')) return <Github className="w-5 h-5" />
        return <Globe className="w-5 h-5" />
    }

    if (isEditing) {
        return (
            <div className="flex flex-col gap-3 pt-4 w-full max-w-md bg-emerald-50/30 p-5 rounded-3xl border border-emerald-100 shadow-sm">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Curator Links</p>

                {links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                        <Input
                            placeholder="Platform (e.g. GitHub)"
                            value={link.label}
                            onChange={e => updateLink(index, 'label', e.target.value)}
                            className="h-10 bg-white w-1/3"
                        />
                        <Input
                            placeholder="url.com/username"
                            value={link.url}
                            onChange={e => updateLink(index, 'url', e.target.value)}
                            className="h-10 bg-white flex-1"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLinkRow(index)}
                            className="text-slate-400 hover:text-red-500"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}

                <Button
                    variant="outline"
                    onClick={addLinkRow}
                    className="mt-2 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 rounded-xl"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Link
                </Button>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-emerald-100">
                    <Button size="sm" onClick={handleSave} disabled={loading || isInvalid} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 h-10 font-bold">
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />} Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel} className="rounded-full px-5 h-10 font-semibold text-slate-500">
                        Cancel
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-wrap items-center gap-4 pt-2 group">
            {links.map((link, index) => (
                <a
                    key={index}
                    href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-all bg-slate-50 hover:bg-emerald-50 px-3 py-1.5 rounded-full border border-transparent hover:border-emerald-100"
                >
                    {getIcon(link.label)}
                    <span className="text-xs font-bold uppercase tracking-tight">{link.label || 'Link'}</span>
                </a>
            ))}

            {links.length === 0 && isOwnProfile && (
                <Button onClick={handleEdit} variant="outline" className="rounded-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Add Social Links
                </Button>
            )}

            {links.length > 0 && isOwnProfile && (
                <button onClick={handleEdit} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-emerald-600 p-2">
                    <Edit2 className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}