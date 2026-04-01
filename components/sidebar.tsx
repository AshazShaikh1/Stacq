"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, PlusSquare, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreateStacqModal } from "@/components/stacq/create-stacq-modal"

const navItems = [
    { icon: Home, label: "Home", href: "/feed" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: PlusSquare, label: "Create", href: "/stacq/new", isCreate: true },
    { icon: Bookmark, label: "Saved", href: "/saved" }
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <>
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-20 lg:w-64 border-r border-border bg-background p-4 z-50">
                <Link href="/feed" className="flex items-center gap-2 px-2 mb-8 group">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black shadow-emerald group-hover:scale-110 transition-transform">S</div>
                    <span className="hidden lg:block text-xl font-black tracking-tighter text-foreground">Stacq</span>
                </Link>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href
                        
                        if (item.isCreate) {
                            return (
                                <div key={item.label} className="mt-6 mb-2">
                                    <CreateStacqModal>
                                        <button className="flex items-center justify-center lg:justify-start gap-4 p-3 lg:px-6 lg:h-14 rounded-xl lg:rounded-full group cursor-pointer w-full text-left bg-primary text-primary-foreground shadow-emerald/20 hover:shadow-lg hover:bg-primary-dark active:scale-95 transition-all outline-none border-none">
                                            <item.icon className="h-6 w-6 shrink-0" />
                                            <span className="hidden lg:block font-black text-base">
                                                {item.label}
                                            </span>
                                        </button>
                                    </CreateStacqModal>
                                </div>
                            )
                        }

                        return (
                            <Link key={item.label} href={item.href} className="block outline-none">
                                <div
                                    className={cn(
                                        "flex items-center gap-4 p-3 rounded-xl transition-all group cursor-pointer w-full text-left",
                                        isActive 
                                            ? "bg-primary/10 text-primary" 
                                            : "hover:bg-surface text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <item.icon className={cn("h-6 w-6 transition-colors", isActive && "text-primary")} />
                                    <span className={cn(
                                        "hidden lg:block font-bold transition-colors", 
                                        isActive ? "text-primary" : ""
                                    )}>
                                        {item.label}
                                    </span>
                                </div>
                            </Link>
                        )
                    })}
                </nav>
            </aside>

            {/* MOBILE BOTTOM NAV */}
            {/* Uses glass-effect and pb-safe for a premium mobile OS feel */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-t border-border flex items-center justify-around px-4 z-50 pb-[env(safe-area-inset-bottom)]">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    
                    if (item.isCreate) {
                        return (
                            <CreateStacqModal key={item.label}>
                                <button className="relative -top-5 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-emerald active:scale-90 transition-transform hover:bg-primary-dark border-none outline-none">
                                    <item.icon className="h-7 w-7" />
                                </button>
                            </CreateStacqModal>
                        )
                    }

                    return (
                        <Link 
                            key={item.label} 
                            href={item.href} 
                            className={cn(
                                "flex flex-col items-center gap-1 p-2 transition-all active:scale-95",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", isActive && "fill-primary/10")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}