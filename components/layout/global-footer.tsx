"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function GlobalFooter() {
    const pathname = usePathname()

    
    // Don't show the global layout footer on the landing page, 
    // as it has its own specialized footer already.
    if (pathname === "/") return null

    return (
        <footer className="w-full py-4 sm:py-6 px-4 bg-surface border-t border-border/50 flex flex-col items-center justify-center gap-4 sm:gap-6 mt-auto">
            <Link href="/" className="group transition-all duration-300">
                <Image
                    src="/logo-text.svg"
                    alt="Stacq Logo"
                    width={80}
                    height={26}
                    loading="lazy"
                    className="h-[26px] w-auto grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                />
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[10px] sm:text-xs font-bold text-muted-foreground/50">
                <p>© {new Date().getFullYear()} Stacq.in</p>
                <a href="/about" className="hover:text-primary transition-colors cursor-pointer">About</a>
                <a href="/terms" className="hover:text-primary transition-colors cursor-pointer">Terms</a>
                <a href="/privacy" className="hover:text-primary transition-colors cursor-pointer">Privacy</a>
                <a href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact</a>
                <a href="/report" className="hover:text-primary transition-colors cursor-pointer">Report Issue</a>
            </div>
        </footer>
    )
}

