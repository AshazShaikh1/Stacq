"use client"

import { useState } from "react"
import { Flag, ArrowRight, Copy, Check } from "lucide-react"

export function ReportContent() {
    const [copied, setCopied] = useState(false)
    const reportEmail = "hello@stacq.in"
    const mailtoLink = `mailto:${reportEmail}?subject=Content Report: [Issue Summary]&body=Please provide the link to the offending content and a brief description of the issue.`

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(reportEmail)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="max-w-2xl mx-auto px-6 py-24 space-y-8">
            <div className="space-y-4 text-center">
                <div className="w-16 h-16 bg-destructive/10 text-destructive flex items-center justify-center rounded-3xl mx-auto mb-6">
                    <Flag className="w-8 h-8" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                    Report an Issue
                </h1>
                <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto">
                    Help us keep Stacq high-signal. Report broken links, spam, or abusive content.
                </p>
            </div>

            <div className="bg-surface border border-border p-6 md:p-8 rounded-3xl shadow-sm space-y-8">
                <p className="text-foreground font-medium leading-relaxed">
                    Please email our team with a link to the offending collection or profile, and a brief description of the issue.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Primary Action */}
                    <a
                        href={mailtoLink}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-4 rounded-2xl font-bold transition-all active:scale-[0.98]"
                    >
                        Report via Email <ArrowRight className="w-4 h-4" />
                    </a>

                    {/* Secondary Action / Fallback */}
                    <button
                        onClick={copyToClipboard}
                        className="flex-1 inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground px-6 py-4 rounded-2xl font-bold hover:bg-muted transition-all active:scale-[0.98]"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 text-green-500" />
                                Copied Email
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                Copy Address
                            </>
                        )}
                    </button>
                </div>

                <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                        Our trust & safety team reviews every report. Thank you for keeping the community safe.
                    </p>
                </div>
            </div>
        </div>
    )
}
