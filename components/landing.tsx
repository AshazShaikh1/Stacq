"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, FolderOpen, Link as LinkIcon, Share2, Rocket } from 'lucide-react'
import { signInWithGoogle } from '@/lib/supabase/actions'
import { WaitlistModal } from '@/components/waitlist-modal'

const LandingPageUI = () => {
    const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Main Content */}
            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative px-4 pt-24 pb-32 md:pt-32 md:pb-40 overflow-hidden flex flex-col items-center text-center">
                    {/* Background blob for that subtle glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-in fade-in duration-1000" />

                    <Badge variant="outline" className="mb-8 border-primary text-primary px-3 py-1 rounded-full text-xs font-semibold bg-primary/5 tracking-wider">
                        THE CURATION PLATFORM
                    </Badge>

                    <h1 className="max-w-4xl text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-4 sm:mb-6">
                        The Filter for a <br className="hidden sm:block" />
                        <span className="text-primary">Noisy Internet.</span>
                    </h1>

                    <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed text-balance">
                        Google finds it. AI summarizes it. Stacq tells you if it’s actually worth your time. Build your personal network of human-tested resources.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <Button onClick={() => setIsWaitlistOpen(true)} className="w-full sm:w-auto btn-primary px-8 py-6 text-lg rounded-full hover:bg-primary-dark cursor-pointer">
                            Get started
                        </Button>
                        <Button variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg rounded-full btn-outline border-border cursor-pointer">
                            Browse Collections
                        </Button>
                    </div>
                </section>

                {/* How Stacq Works Section (Alternating Feature Blocks) */}
                <section className="px-4 py-24 bg-surface w-full flex flex-col items-center">
                    <div className="max-w-7xl w-full mx-auto flex flex-col items-center">
                        <div className="text-center mb-16 md:mb-24">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How Stacq Works</h2>
                            <p className="text-muted-foreground text-lg">Three simple steps to cure information overload.</p>
                        </div>

                        <div className="flex flex-col gap-24 w-full">
                            {/* Feature 1 */}
                            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-24 w-full">
                                <div className="flex-1 space-y-4 md:space-y-6 md:pr-12 text-center md:text-left">
                                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark mb-6">
                                        <FolderOpen className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold">Tested by People.</h3>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        We don’t compete with algorithms. We complement them. Every link in a Stacq comes with a &quot;Why&quot;—the personal context from a real human who actually used the tool, read the article, or ran the code.
                                    </p>
                                </div>
                                <div className="flex-1 w-full relative">
                                    <div className="rounded-2xl border border-border shadow-xl bg-background aspect-4/3 w-full relative overflow-hidden flex items-center justify-center group">
                                        <div className="absolute inset-0 bg-primary/5 transition-opacity opacity-0 group-hover:opacity-100" />
                                        <FolderOpen className="w-24 h-24 text-primary/20" />
                                    </div>
                                </div>
                            </div>

                            {/* Feature 2: Reversed */}
                            <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12 lg:gap-24 w-full">
                                <div className="flex-1 space-y-4 md:space-y-6 md:pl-12 text-center md:text-left">
                                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark mb-6">
                                        <LinkIcon className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold">High-Signal Curation.</h3>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        Stop digging through 10-page Reddit threads or generic AI lists. Discover &quot;Stacks&quot; curated by experts who have already done the trial and error for you.
                                    </p>
                                </div>
                                <div className="flex-1 w-full relative">
                                    <div className="rounded-2xl border border-border shadow-xl bg-background aspect-4/3 w-full relative overflow-hidden flex items-center justify-center group">
                                        <div className="absolute inset-0 bg-primary/5 transition-opacity opacity-0 group-hover:opacity-100" />
                                        <LinkIcon className="w-24 h-24 text-primary/20" />
                                    </div>
                                </div>
                            </div>

                            {/* Feature 3 */}
                            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-24 w-full">
                                <div className="flex-1 space-y-4 md:space-y-6 md:pr-12 text-center md:text-left">
                                    <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark mb-6">
                                        <Share2 className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold">Your Personal Knowledge Base.</h3>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        Transform your scattered bookmarks into a clean, professional library. Organise the best of the internet into Stacks that you can share with your team, your students, or the world.
                                    </p>
                                </div>
                                <div className="flex-1 w-full relative">
                                    <div className="rounded-2xl border border-border shadow-xl bg-background aspect-4/3 w-full relative overflow-hidden flex items-center justify-center group">
                                        <div className="absolute inset-0 bg-primary/5 transition-opacity opacity-0 group-hover:opacity-100" />
                                        <Rocket className="w-24 h-24 text-primary/20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bottom CTA Section */}
                <section className="w-full bg-primary text-primary-foreground py-24 px-4 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    <div className="z-10 max-w-3xl">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
                            Ready to curate your corner?
                        </h2>
                        <p className="text-lg md:text-xl md:leading-relaxed text-primary-foreground/90 mb-10 max-w-2xl mx-auto">
                            Join thousands of learners, developers, and creators building their personal knowledge bases on Stacq.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button onClick={() => setIsWaitlistOpen(true)} variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg rounded-full bg-transparent border-white text-white hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
                                Create your account
                            </Button>
                            <Button variant="secondary" className="w-full sm:w-auto px-8 py-6 text-lg rounded-full bg-white text-primary hover:bg-white/90 shadow-lg cursor-pointer">
                                Browse collections
                            </Button>
                        </div>
                        <p className="mt-8 text-sm text-primary-foreground/70">
                            Always free for individuals • No credit card required
                        </p>
                    </div>
                </section>
            </main>
            <WaitlistModal isOpen={isWaitlistOpen} onOpenChange={setIsWaitlistOpen} />

            {/* Footer */}
            <footer className="w-full bg-[#0a0a0a] text-zinc-400 py-12 md:py-16 px-4">
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 mb-12 md:mb-16">
                    <div className="col-span-1 sm:col-span-2 space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                S
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">Stacq</span>
                        </div>
                        <p className="text-sm text-zinc-500 max-w-sm">
                            Stacq is a modern platform for curating and sharing the things you love from the internet.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-6">Account</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a href="/login" className="hover:text-primary transition-colors">Log in</a></li>
                            <li><a href="/signup" className="hover:text-primary transition-colors">Sign up</a></li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto pt-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
                    <p>© 2026 Stacq. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div >
    )
}

export default LandingPageUI