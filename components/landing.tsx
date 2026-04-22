"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Link as LinkIcon, Share2 } from "lucide-react";
import { signInWithGoogle } from "@/lib/supabase/actions";
import Image from "next/image";
import Link from "next/link";

// ─── Feature data ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: FolderOpen,
    title: "Follow experts who curate for you.",
    // Desktop (full)
    descDesktop:
      "Follow curators in design, engineering, and tech. See the tools, articles, and resources practitioners actually use — not just what ranks on Google.",
    // Mobile (≤60 chars, punchy)
    descMobile: "Skip the noise. Follow practitioners, not algorithms.",
  },
  {
    icon: LinkIcon,
    title: "Expert-picked resources. Skip the rabbit hole.",
    descDesktop:
      "Every collection on Stacq is hand-picked. Real people, real experience — no AI-generated link dumps.",
    descMobile: "Hand-picked by real people. No AI-generated filler.",
  },
  {
    icon: Share2,
    title: "Build your own resource library.",
    descDesktop:
      "Transform your scattered bookmarks into a clean, shareable list. Your personal resource vault, live at stacq.in/yourname.",
    descMobile: "Turn messy bookmarks into a clean, shareable vault.",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────
const LandingPageUI = () => {
  const router = useRouter();
  const [handle, setHandle] = useState("");

  const handleClaim = () => {
    const raw = handle.trim().replace(/^@/, "");
    const encoded = encodeURIComponent(raw);
    // Only track if PostHog is initialised (keys are set)
    if (posthog.__loaded) {
      posthog.capture("handle_claim_clicked", {
        handle: raw || "(empty)",
        had_handle: raw.length > 0,
      });
    }
    router.push(encoded ? `/signup?handle=${encoded}` : "/signup");
  };

  return (
    <div className="w-full min-h-screen bg-background flex flex-col">
      <main className="flex-1">
        {/* ── Hero ── */}
        {/* Mobile: reduced vertical padding so handle input sits near centre */}
        <section className="relative pt-10 pb-12 sm:pt-24 sm:pb-32 md:pt-32 md:pb-40 overflow-hidden w-full">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-xl sm:max-w-2xl h-56 sm:h-64 bg-primary/10 rounded-full blur-3xl -z-10 animate-in fade-in duration-1000" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <Badge
              variant="outline"
              className="mb-5 sm:mb-8 border-primary text-primary px-3 py-1 rounded-full text-xs font-semibold bg-primary/5 tracking-wider"
            >
              EXPERT-CURATED RESOURCE LISTS
            </Badge>

            {/* Headline — tighter on mobile */}
            <h1 className="text-3xl sm:text-6xl md:text-8xl font-black tracking-tight text-foreground leading-[1.1] mb-4 sm:mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Expert-curated lists —{" "}
              <span className="text-primary block sm:inline">
                tools that actually work.
              </span>
            </h1>

            {/* Sub-copy: hidden on smallest mobile to save vertical space */}
            <p className="hidden sm:block text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium mb-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              Stacq is a tool for saving and sharing curated resource lists.
              Built by people, not algorithms.
            </p>

            {/* Handle Checker — full-width on mobile, constrained on desktop */}
            <div className="w-full max-w-md mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
              <div className="flex items-center bg-background border-2 border-border hover:border-primary/40 focus-within:border-primary rounded-full overflow-hidden shadow-sm transition-all h-14">
                <span className="pl-5 pr-1 text-muted-foreground font-bold text-sm sm:text-base shrink-0 select-none">
                  stacq.in/
                </span>
                <input
                  id="handle-input"
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                  placeholder="yourhandle"
                  className="flex-1 bg-transparent outline-none text-foreground font-bold text-sm sm:text-base placeholder:text-muted-foreground/50 min-w-0"
                  aria-label="Claim your handle"
                />
                <button
                  onClick={handleClaim}
                  className="h-full px-4 sm:px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm rounded-full transition-all active:scale-95 shrink-0"
                >
                  Claim <span className="hidden sm:inline">handle</span>
                </button>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-2 font-medium">
                Free forever · No credit card required
              </p>
            </div>

            {/* Secondary CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                onClick={() => router.push("/explore")}
                variant="outline"
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full btn-outline border-border cursor-pointer"
              >
                Browse resource lists
              </Button>
            </div>

            {/* Social proof — desktop only */}
            <p className="hidden md:block mt-6 text-xs text-muted-foreground/50 font-medium">
              Join curators sharing what actually works →
            </p>
          </div>
        </section>

        {/* ── Features Section ── */}
        <section className="px-4 sm:px-6 lg:px-8 py-12 sm:py-20 md:py-24 bg-surface w-full flex flex-col items-center">
          <div className="max-w-7xl w-full mx-auto flex flex-col items-center">
            <div className="text-center mb-8 sm:mb-14 md:mb-24">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3 sm:mb-4">
                What you can do on Stacq
              </h2>
              <p className="text-muted-foreground text-sm sm:text-lg">
                Save links, organize them into lists, and share with anyone.
              </p>
            </div>

            {/* ── MOBILE: snap-scroll horizontal carousel (md:hidden) ── */}
            <div className="md:hidden w-full -mx-4 px-4">
              {/* Outer mask to keep snap-list visible edge-to-edge */}
              <div
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none"
                style={{
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {FEATURES.map((f, i) => (
                  <div
                    key={i}
                    className="snap-start shrink-0 w-[85vw] bg-background rounded-2xl border border-border p-5 flex flex-col gap-3 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold leading-snug">
                      {f.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {f.descMobile}
                    </p>
                  </div>
                ))}
                {/* Edge hint spacer */}
                <div className="shrink-0 w-4" aria-hidden />
              </div>
              {/* Scroll hint dots */}
              <div className="flex justify-center gap-1.5 mt-3">
                {FEATURES.map((_, i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary/30"
                  />
                ))}
              </div>
            </div>

            {/* ── DESKTOP: vertical stacked layout (hidden on mobile) ── */}
            {/* ── DESKTOP: vertical stacked layout (hidden on mobile) ── */}
            <div className="hidden md:flex flex-col gap-24 md:gap-32 w-full max-w-6xl mx-auto">
              {FEATURES.map((f, i) => (
                <div
                  key={i}
                  className={`flex flex-col md:flex-row ${
                    i % 2 === 1 ? "md:flex-row-reverse" : ""
                  } items-center justify-between gap-12 lg:gap-24 w-full`}
                >
                  {/* Text Content: Fixed width to prevent pushing the image */}
                  <div className="flex-1 max-w-md space-y-6 text-left">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                      <f.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold tracking-tight">
                      {f.title}
                    </h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">
                      {f.descDesktop}
                    </p>
                  </div>

                  {/* Image Placeholder: Constrained size to stop the "Big" look */}
                  <div className="flex-1 w-full max-w-[500px]">
                    <div className="rounded-3xl border border-border shadow-2xl bg-background aspect-4/3 w-full relative overflow-hidden flex items-center justify-center group transition-all hover:border-primary/20">
                      <div className="absolute inset-0 bg-primary/5 transition-opacity opacity-0 group-hover:opacity-100" />
                      <f.icon className="w-20 h-20 text-primary/10 group-hover:text-primary/20 transition-all group-hover:scale-110" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Section ── */}
        <section className="w-full bg-primary text-primary-foreground py-16 sm:py-24 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 sm:w-96 h-72 sm:h-96 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="z-10 max-w-3xl w-full">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4 sm:mb-6 text-white">
              Your next go-to resource list is one click away.
            </h2>

            <p className="text-sm sm:text-lg md:text-xl text-primary-foreground/90 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Build a shareable list of your best links. Or browse what the
              community has already curated — free, no account needed.
            </p>

            {/* ── Handle Checker (CTA section) — desktop only ── */}
            <div className="hidden sm:flex items-center bg-white/10 border-2 border-white/30 hover:border-white/60 focus-within:border-white rounded-full overflow-hidden shadow-sm transition-all h-14 max-w-md mx-auto mb-6">
              <span className="pl-5 pr-1 text-white/70 font-bold text-sm shrink-0 select-none">
                stacq.in/
              </span>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/\s/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleClaim()}
                placeholder="yourhandle"
                className="flex-1 bg-transparent outline-none text-white font-bold text-sm placeholder:text-white/40 min-w-0"
                aria-label="Claim your handle (CTA)"
              />
              <button
                onClick={handleClaim}
                className="h-full px-5 bg-white hover:bg-white/90 text-primary font-black text-sm rounded-full transition-all active:scale-95 shrink-0"
              >
                Claim handle
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Button
                onClick={signInWithGoogle}
                variant="outline"
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full bg-transparent border-white text-white hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              >
                Start building for free
              </Button>

              <Button
                onClick={() => router.push("/explore")}
                variant="secondary"
                className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-full bg-white text-primary hover:bg-white/90 shadow-lg cursor-pointer"
              >
                Browse resource lists
              </Button>
            </div>

            <p className="mt-6 sm:mt-8 text-xs text-primary-foreground/70">
              Always free for individuals · No credit card required
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full bg-[#0a0a0a] text-zinc-400 py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-4 space-y-6">
              <div className="flex items-center gap-3">
                <Image
                  className="hover:scale-105 transition-all cursor-pointer shrink-0"
                  src={"/logo-text.svg"}
                  alt="Stacq"
                  width={140}
                  height={40}
                  style={{ width: "auto", height: "40px" }}
                />
              </div>
              <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
                A tool for saving and sharing curated resource lists. Built by
                the community, for the community.
              </p>
            </div>

            {/* Links */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
              {[
                {
                  heading: "Product",
                  links: [
                    { href: "/explore", label: "Explore" },
                    { href: "/feed", label: "Discovery" },
                    { href: "/signup", label: "Get Started" },
                  ],
                },
                {
                  heading: "Account",
                  links: [
                    { href: "/login", label: "Log In" },
                    { href: "/signup", label: "Sign Up" },
                    { href: "/profile", label: "My Profile" },
                  ],
                },
                {
                  heading: "Links",
                  links: [
                    { href: "/contact", label: "Contact" },
                    { href: "/report", label: "Report Issue" },
                    { href: "/about", label: "About Us" },
                  ],
                },
                {
                  heading: "Policies",
                  links: [
                    { href: "/privacy", label: "Privacy" },
                    { href: "/terms", label: "Terms" },
                  ],
                },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">
                    {heading}
                  </h4>
                  <ul className="space-y-4 text-sm">
                    {links.map(({ href, label }) => (
                      <li key={href}>
                        <Link
                          href={href}
                          className="hover:text-primary transition-colors"
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs font-medium text-zinc-500">
            <p>© 2026 Stacq · Curated by humans, not algorithms.</p>
            <div className="flex gap-8">
              <Link
                href="https://x.com/stacq21"
                className="hover:text-white transition-colors"
              >
                Twitter
              </Link>
              <Link
                href="https://instagram.com/stacq1"
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
