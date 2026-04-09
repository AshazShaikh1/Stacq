"use client"

import { usePathname } from "next/navigation"

export function GlobalFooter() {
    const pathname = usePathname()
    
    // Don't show the global layout footer on the landing page, 
    // as it has its own specialized footer already.
    if (pathname === "/") return null

    return (
        <footer className="w-full py-4 text-center text-[10px] sm:text-xs font-bold text-muted-foreground/60 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-auto border-t border-border/50">
            <p>© {new Date().getFullYear()} Stacq.in</p>
            <a href="/about" className="hover:text-primary transition-colors cursor-pointer">About</a>
            <a href="/terms" className="hover:text-primary transition-colors cursor-pointer">Terms</a>
            <a href="/privacy" className="hover:text-primary transition-colors cursor-pointer">Privacy</a>
            <a href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact</a>
            <a href="/report" className="hover:text-primary transition-colors cursor-pointer">Report Issue</a>
        </footer>
    )
}
