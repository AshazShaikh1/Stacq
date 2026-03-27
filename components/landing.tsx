"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, FolderOpen, Link as LinkIcon, Share2, Rocket } from 'lucide-react'
import { signInWithGoogle } from '@/lib/supabase/actions'

const LandingPageUI = () => {
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
                        Curate the internet, <br className="hidden sm:block" />
                        <span className="text-primary">not just consume it.</span>
                    </h1>

                    <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed text-balance">
                        Stacq is a human-curated knowledge network. Save the best resources, organize them into Stacqs, and discover what experts are actually reading.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        <Button onClick={signInWithGoogle} className="w-full sm:w-auto btn-primary px-8 py-6 text-lg rounded-full hover:bg-primary-dark cursor-pointer">
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
                                    <h3 className="text-2xl md:text-3xl font-bold">Create Collections</h3>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        Group your resources into neat, sharable spaces. Add articles, links, tools, repositories, images, and more.
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
                                    <h3 className="text-2xl md:text-3xl font-bold">Add Cards</h3>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        Save any content from the internet. Add context and notes on why it&apos;s useful to you, making it more valuable for you and others in the future.
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
                                    <h3 className="text-2xl md:text-3xl font-bold">Share & Discover</h3>
                                    <p className="text-muted-foreground text-lg leading-relaxed">
                                        Publish your collections, follow others, and find high-quality resources. Build your reputation as a curator within the network.
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

                {/* Trending Section */}
                <section className="px-4 py-24 w-full flex flex-col items-center bg-background">
                    <div className="max-w-7xl w-full mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Trending Now</h2>
                            <p className="text-muted-foreground text-lg">See what the community is curating and discussing this week.</p>
                        </div>

                        <div className="flex justify-center gap-3 mb-12 flex-wrap">
                            <Badge variant="secondary" className="px-4 py-3 text-sm cursor-pointer hover:bg-secondary/80">
                                🔥 All collections
                            </Badge>
                            <Badge variant="outline" className="px-4 py-3 text-sm cursor-pointer hover:bg-surface-hover">
                                🎨 Design tools
                            </Badge>
                        </div>

                        {/* Stacq Grid Placeholders */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                            {/* Card 1 */}
                            <Card className="hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer border-border">
                                <div className="h-40 bg-surface w-full relative">
                                    <div className="absolute inset-0 flex items-center justify-center transition-transform group-hover:scale-110">
                                        <FolderOpen className="text-primary/30 w-12 h-12" />
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <div className="flex gap-2 items-center mb-3">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">A</div>
                                        <span className="text-sm text-muted-foreground">Alex Smith</span>
                                    </div>
                                    <h4 className="font-bold text-lg mb-2 line-clamp-1">React 19</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2">A collection of resources about React 19, server components, and actions.</p>
                                </CardContent>
                            </Card>

                            {/* Card 2 */}
                            <Card className="hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer border-border">
                                <div className="h-40 bg-surface w-full relative">
                                    <div className="absolute inset-0 flex items-center justify-center transition-transform group-hover:scale-110">
                                        <FolderOpen className="text-primary/30 w-12 h-12" />
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <div className="flex gap-2 items-center mb-3">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-600">S</div>
                                        <span className="text-sm text-muted-foreground">Sarah Li</span>
                                    </div>
                                    <h4 className="font-bold text-lg mb-2 line-clamp-1">Modern UI/UX Inspiration</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2">My favorite websites and design systems in 2026. Great for finding ideas.</p>
                                </CardContent>
                            </Card>

                            {/* Card 3 */}
                            <Card className="hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer border-border">
                                <div className="h-40 bg-surface w-full relative">
                                    <div className="absolute inset-0 flex items-center justify-center transition-transform group-hover:scale-110">
                                        <FolderOpen className="text-primary/30 w-12 h-12" />
                                    </div>
                                </div>
                                <CardContent className="p-5">
                                    <div className="flex gap-2 items-center mb-3">
                                        <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px] font-bold text-orange-600">J</div>
                                        <span className="text-sm text-muted-foreground">Jordan Dev</span>
                                    </div>
                                    <h4 className="font-bold text-lg mb-2 line-clamp-1">Zustand vs Redux</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2">A comparison of state management libraries for React applications.</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-center">
                            <Button variant="ghost" className="text-muted-foreground hover:text-foreground cursor-pointer">
                                Explore All Trending <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
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
                            <Button onClick={signInWithGoogle} variant="outline" className="w-full sm:w-auto px-8 py-6 text-lg rounded-full bg-transparent border-white text-white hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
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
                        <h4 className="text-white font-semibold mb-6">Product</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Collections</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Showcase</a></li>
                            <li><a href="#" className="hover:text-primary transition-colors">Trending</a></li>
                        </ul>
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
        </div>
    )
}

export default LandingPageUI