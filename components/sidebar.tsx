"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, PlusSquare, Bell, User, Settings, LogOut, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/supabase/actions"

const navItems = [
    { icon: Home, label: "Home", href: "/feed" },
    { icon: Compass, label: "Explore", href: "/explore" },
    { icon: PlusSquare, label: "Create", href: "/stacq/new", isCreate: true },
    { icon: Bookmark, label: "Saved", href: "/saved" },
    { icon: User, label: "Profile", href: "/profile" },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <>
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-20 lg:w-64 border-r bg-white p-4 z-50">
                <Link href="/feed" className="flex items-center gap-2 px-2 mb-8">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">S</div>
                    <span className="hidden lg:block text-xl font-bold tracking-tighter">Stacq</span>
                </Link>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 p-3 rounded-xl transition-all group",
                                pathname === item.href ? "bg-primary/10 text-primary" : "hover:bg-slate-100 text-slate-600"
                            )}
                        >
                            <item.icon className={cn("h-6 w-6", pathname === item.href && "text-primary")} />
                            <span className="hidden lg:block font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                {/* Desktop Bottom Actions */}
                <div className="mt-auto space-y-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-4 p-3 w-full rounded-xl hover:bg-slate-100 transition-all outline-none cursor-pointer">
                            <Settings className="h-6 w-6 text-slate-600" />
                            <span className="hidden lg:block font-medium text-slate-600">Settings</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => signOut()}>
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t flex items-center justify-around px-2 z-50 pb-safe">
                {navItems.map((item) => {
                    if (item.isCreate) {
                        return (
                            <div key={item.label} className="relative -top-5">
                                <Link 
                                    href={item.href} 
                                    className="flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-lg shadow-emerald hover:scale-105 transition-transform"
                                >
                                    <item.icon className="h-6 w-6 text-white" />
                                </Link>
                            </div>
                        )
                    }

                    return (
                        <Link key={item.label} href={item.href} className={cn("p-2 transition-colors", pathname === item.href && "bg-primary/10 rounded-xl")}>
                            <item.icon className={cn("h-6 w-6", pathname === item.href ? "text-primary" : "text-slate-500")} />
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}