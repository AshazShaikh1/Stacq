"use client"

import { useState } from "react"
import { Mail, MessageSquare, Copy, Check } from "lucide-react"

export function ContactContent() {
    const [copied, setCopied] = useState(false)
    const email = "hello@stacq.in"

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(email)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="max-w-2xl mx-auto px-6 py-24 space-y-12 text-center">
            <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-3xl mx-auto mb-6">
                    <MessageSquare className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black tracking-tight text-foreground">
                    We&apos;d love to hear from you.
                </h1>
                <p className="text-xl text-muted-foreground font-medium">
                    Whether you have a feature request, a bug report, or just want to chat about curation.
                </p>
            </div>

            <div className="bg-surface border border-border p-8 rounded-3xl max-w-md mx-auto shadow-sm space-y-4">
                {/* Primary Action: Open Mail App */}
                <a
                    href={`mailto:${email}`}
                    className="flex items-center justify-center gap-3 w-full bg-primary text-background py-4 rounded-2xl font-bold hover:opacity-90 transition-all active:scale-[0.98]"
                >
                    <Mail className="w-5 h-5" />
                    Send an Email
                </a>

                {/* Secondary Action: Copy Email (The Fallback) */}
                <button
                    onClick={copyToClipboard}
                    className="flex items-center justify-center gap-3 w-full border border-border bg-background text-foreground py-4 rounded-2xl font-bold hover:bg-muted transition-all active:scale-[0.98] cursor-pointer"
                >
                    {copied ? (
                        <>
                            <Check className="w-5 h-5 text-green-500" />
                            Copied to Clipboard
                        </>
                    ) : (
                        <>
                            <Copy className="w-5 h-5" />
                            Copy {email}
                        </>
                    )}
                </button>

                <p className="text-sm text-muted-foreground mt-4 font-medium">
                    We try to respond to all inquiries within 24 hours.
                </p>
            </div>
        </div>
    )
}
