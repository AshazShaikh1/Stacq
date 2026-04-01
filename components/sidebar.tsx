"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, PlusSquare, Bookmark, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreateStacqModal } from "@/components/stacq/create-stacq-modal"
import { useAuth } from "@/components/auth/auth-provider"

const navItems = [
    { icon: Home, label: "Home", href: "/feed" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: PlusSquare, label: "Create", href: "/stacq/new", isCreate: true },
    { icon: Bookmark, label: "Saved", href: "/saved" },
    { icon: User, label: "Profile", href: "/profile" }
]

export default function Sidebar() {
    const pathname = usePathname()
    const { session } = useAuth()

    // Don't render at all until we know the user is authenticated
    if (!session) return null

    return (
        <>
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-20 lg:w-64 border-r border-border bg-background p-3 lg:p-4 z-50">

                <Link href="/feed" className="flex items-center gap-2 px-2 mb-6 lg:mb-8 group">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black shadow-emerald group-hover:scale-110 transition-transform">
                        S
                    </div>
                    <span className="hidden lg:block text-xl font-black tracking-tighter text-foreground">
                        Stacq
                    </span>
                </Link>

                <nav className="flex-1 space-y-2">

                    {navItems.map((item) => {

                        const isActive = pathname === item.href

                        if (item.isCreate) {
                            return (
                                <div key={item.label} className="mt-5 lg:mt-6 mb-2">

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

                                    <item.icon
                                        className={cn(
                                            "h-6 w-6 transition-colors",
                                            isActive && "text-primary"
                                        )}
                                    />

                                    <span
                                        className={cn(
                                            "hidden lg:block font-bold transition-colors",
                                            isActive ? "text-primary" : ""
                                        )}
                                    >
                                        {item.label}
                                    </span>

                                </div>

                            </Link>
                        )
                    })}

                </nav>

            </aside>



            {/* MOBILE BOTTOM NAV */}
            <div className="md:hidden fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-md sm:max-w-lg z-50">

                <nav className="bg-background/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl sm:rounded-4xl flex items-center justify-between px-2 sm:px-3 py-2">

                    {navItems.map((item) => {

                        const isActive = pathname === item.href

                        if (item.isCreate) {
                            return (
                                <CreateStacqModal key={item.label}>

                                    <button className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 bg-primary text-primary-foreground rounded-xl sm:rounded-2xl shadow-lg shadow-emerald/20 active:scale-90 transition-all hover:bg-primary-dark border-none outline-none">

                                        <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />

                                    </button>

                                </CreateStacqModal>
                            )
                        }

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center min-w-12 sm:min-w-14 h-11 sm:h-12 rounded-xl sm:rounded-2xl transition-all active:scale-95",
                                    isActive
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >

                                <item.icon
                                    className={cn(
                                        "h-4 w-4 sm:h-5 sm:w-5",
                                        isActive && "fill-primary/10"
                                    )}
                                />

                                <span className="text-[9px] sm:text-[10px] font-bold mt-0.5">
                                    {item.label}
                                </span>

                            </Link>
                        )
                    })}

                </nav>

            </div>
        </>
    )
}