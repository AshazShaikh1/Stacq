"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  FolderOpen,
  Link as LinkIcon,
  Share2,
  Rocket,
} from "lucide-react";
import { signInWithGoogle } from "@/lib/supabase/actions";
import Image from "next/image";
import Link from "next/link";

const LandingPageUI = () => {
  const router = useRouter();
  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-20 pb-24 sm:pt-24 sm:pb-32 md:pt-32 md:pb-40 overflow-hidden w-full">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl sm:max-w-2xl h-56 sm:h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-in fade-in duration-1000" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <Badge
              variant="outline"
              className="mb-6 sm:mb-8 border-primary text-primary px-3 py-1 rounded-full text-xs font-semibold bg-primary/5 tracking-wider"
            >
              THE STACQING PLATFORM
            </Badge>

            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tight text-foreground leading-[1.1] mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              The Expert Filter for the{" "}
              <span className="text-primary">Digital Age</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              Stop searching and start finding. Stacq helps you curate the
              high-signal resources that Google and AI often miss.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                onClick={() => router.push("/signup")}
                className="w-full sm:w-auto btn-primary px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full hover:bg-primary-dark cursor-pointer"
              >
                Get started
              </Button>

              <Button
                onClick={() => router.push("/explore")}
                variant="outline"
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full btn-outline border-border cursor-pointer"
              >
                Browse Stacqs
              </Button>
            </div>
          </div>
        </section>

        {/* How Stacq Works */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-24 bg-surface w-full flex flex-col items-center">
          <div className="max-w-7xl w-full mx-auto flex flex-col items-center">
            <div className="text-center mb-14 sm:mb-16 md:mb-24">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">
                How Stacq Works
              </h2>

              <p className="text-muted-foreground text-base sm:text-lg">
                Three simple steps to cure information overload.
              </p>
            </div>

            <div className="flex flex-col gap-20 sm:gap-24 w-full">
              {/* Feature 1 */}
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-24 w-full">
                <div className="flex-1 space-y-4 md:space-y-6 md:pr-12 text-center md:text-left">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark mb-4 sm:mb-6">
                    <FolderOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                    Verified Stacqers.
                  </h3>

                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                    Follow experts in design, engineering, and tech ventures.
                    See what their filter captures—the high-signal resources
                    that Google and AI often miss.
                  </p>
                </div>

                <div className="flex-1 w-full relative">
                  <div className="rounded-2xl border border-border shadow-xl bg-background aspect-4/3 w-full relative overflow-hidden flex items-center justify-center group">
                    <div className="absolute inset-0 bg-primary/5 transition-opacity opacity-0 group-hover:opacity-100" />

                    <FolderOpen className="w-16 h-16 sm:w-24 sm:h-24 text-primary/20" />
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12 lg:gap-24 w-full">
                <div className="flex-1 space-y-4 md:space-y-6 md:pl-12 text-center md:text-left">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark mb-4 sm:mb-6">
                    <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                    High-Signal Curation.
                  </h3>

                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                    Stop digging through generic AI lists. Discover stacqs
                    curated by stacqers who have already done the trial and
                    error for you.
                  </p>
                </div>

                <div className="flex-1 w-full relative">
                  <div className="rounded-2xl border border-border shadow-xl bg-background aspect-4/3 w-full relative overflow-hidden flex items-center justify-center group">
                    <div className="absolute inset-0 bg-primary/5 transition-opacity opacity-0 group-hover:opacity-100" />

                    <LinkIcon className="w-16 h-16 sm:w-24 sm:h-24 text-primary/20" />
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-24 w-full">
                <div className="flex-1 space-y-4 md:space-y-6 md:pr-12 text-center md:text-left">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark mb-4 sm:mb-6">
                    <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>

                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold">
                    Personal Stacqs.
                  </h3>

                  <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                    Transform your scattered bookmarks into a clean,
                    professional library. Build your personal knowledge base and
                    share it with the world.
                  </p>
                </div>

                <div className="flex-1 w-full relative">
                  <div className="rounded-2xl border border-border shadow-xl bg-background aspect-4/3 w-full relative overflow-hidden flex items-center justify-center group">
                    <div className="absolute inset-0 bg-primary/5 transition-opacity opacity-0 group-hover:opacity-100" />

                    <Rocket className="w-16 h-16 sm:w-24 sm:h-24 text-primary/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full bg-primary text-primary-foreground py-20 sm:py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 sm:w-96 h-72 sm:h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="z-10 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
              Ready to curate your corner?
            </h2>

            <p className="text-base sm:text-lg md:text-xl md:leading-relaxed text-primary-foreground/90 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Join thousands of learners, developers, and creators building
              their personal knowledge bases on stacq.in.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button
                onClick={signInWithGoogle}
                variant="outline"
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full bg-transparent border-white text-white hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                Create your account
              </Button>

              <Button
                onClick={() => router.push("/explore")}
                variant="secondary"
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full bg-white text-primary hover:bg-white/90 shadow-lg cursor-pointer"
              >
                Browse Stacqs
              </Button>
            </div>

            <p className="mt-6 sm:mt-8 text-sm text-primary-foreground/70">
              Always free for individuals • No credit card required
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0a0a0a] text-zinc-400 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            {/* Brand Column */}
            <div className="md:col-span-4 space-y-6">
              <div className="flex items-center gap-3">
                <Image
                  className="hover:scale-105 transition-all cursor-pointer shrink-0"
                  src={"/logo-text.svg"}
                  alt="Stacq"
                  width={200}
                  height={200}
                />
              </div>
              <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
                The human filter for the digital age. Curate, organize, and
                share high-signal resources with a global community of experts.
              </p>
            </div>

            {/* Links Columns */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div>
                <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">
                  Product
                </h4>
                <ul className="space-y-4 text-sm">
                  <li>
                    <Link
                      href="/explore"
                      className="hover:text-primary transition-colors"
                    >
                      Explore
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/feed"
                      className="hover:text-primary transition-colors"
                    >
                      Discovery
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signup"
                      className="hover:text-primary transition-colors"
                    >
                      Get Started
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">
                  Account
                </h4>
                <ul className="space-y-4 text-sm">
                  <li>
                    <Link
                      href="/login"
                      className="hover:text-primary transition-colors"
                    >
                      Log In
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/signup"
                      className="hover:text-primary transition-colors"
                    >
                      Sign Up
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/profile"
                      className="hover:text-primary transition-colors"
                    >
                      My Profile
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">
                  Links
                </h4>
                <ul className="space-y-4 text-sm">
                  <li>
                    <Link
                      href="/contact"
                      className="hover:text-primary transition-colors"
                    >
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/report"
                      className="hover:text-primary transition-colors"
                    >
                      Report Issue
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/about"
                      className="hover:text-primary transition-colors"
                    >
                      About Us
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">
                  Policies
                </h4>
                <ul className="space-y-4 text-sm">
                  <li>
                    <Link
                      href="/privacy"
                      className="hover:text-primary transition-colors"
                    >
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/terms"
                      className="hover:text-primary transition-colors"
                    >
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-medium text-zinc-500">
            <p>© 2026 Stacq. Powered by human curation.</p>
            <div className="flex gap-8">
              <Link
                href="https://twitter.com/stacq"
                className="hover:text-white transition-colors"
              >
                Twitter
              </Link>
              <Link
                href="https://instagram.com/stacq"
                className="hover:text-white transition-colors"
              >
                Instagram
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageUI;
