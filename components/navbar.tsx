"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { signOut } from "@/lib/supabase/actions"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/auth-provider"
import { Search, LogOut, User, Library, Plus, Loader2 } from "lucide-react"
import { CreateStacqModal } from "./stacq/create-stacq-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { session, loading, openAuthModal } = useAuth()
  const [showSignoutConfirm, setShowSignoutConfirm] = useState(false)
  
  const isLandingPage = pathname === "/"

  // Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Close suggestions on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Live Search Logic (Debounced)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([])
        return
      }
      setIsSearching(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('stacqs')
        .select('id, title')
        .ilike('title', `%${searchQuery}%`)
        .limit(5)

      setSuggestions(data || [])
      setIsSearching(false)
    }

    const timer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <nav className="border-b border-border bg-surface sticky top-0 z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl shadow-emerald hover:scale-105 transition-all cursor-pointer shrink-0">
          S
        </Link>

        {/* Search Bar - Hidden on Landing Page */}
        {!isLandingPage && (
          <div ref={searchRef} className="relative flex-1 max-w-md mx-0 sm:mx-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    router.push(`/explore?q=${searchQuery}`);
                    setShowSuggestions(false);
                  }
                }}
                className="pl-9 h-10 text-sm bg-background border-transparent rounded-full focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all w-full"
              />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (searchQuery.length > 1) && (
              <div className="absolute top-12 left-0 right-0 sm:left-0 sm:right-auto sm:w-full bg-background border border-border rounded-2xl shadow-2xl p-2 z-60 animate-in fade-in zoom-in-95 duration-200">
                {isSearching ? (
                  <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                ) : suggestions.length > 0 ? (
                  suggestions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { 
                        router.push(`/stacq/${s.id}`); 
                        setShowSuggestions(false); 
                        setSearchQuery(""); 
                      }}
                      className="w-full text-left p-3 hover:bg-primary/5 rounded-xl transition-colors font-bold text-foreground text-sm flex items-center gap-3 active:scale-[0.98]"
                    >
                      <Search className="w-3.5 h-3.5 text-muted-foreground" /> {s.title}
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-xs text-muted-foreground text-center font-medium italic">No collections found.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right Side Fallback Spacer (If search is hidden) */}
        {isLandingPage && <div className="flex-1" />}

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {!loading && session ? (
            <>
              <CreateStacqModal>
                <button className="hidden lg:flex items-center gap-2 h-11 px-8 bg-primary text-primary-foreground rounded-full font-black text-sm hover:bg-primary-dark transition-all shadow-emerald/20 hover:shadow-lg active:scale-95 cursor-pointer border-none outline-none">
                  <Plus className="w-4 h-4 mr-0.5" /> Create Stacq
                </button>
              </CreateStacqModal>

              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <Avatar className="h-10 w-10 border-2 border-background ring-1 ring-border hover:ring-primary transition-all cursor-pointer">
                    <AvatarImage src={session.user.user_metadata.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-black">
                      {session.user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-border bg-background">
                  <DropdownMenuLabel className="p-3">
                    <p className="font-extrabold text-foreground">{session.user.user_metadata.full_name || "Curator"}</p>
                    <p className="text-xs text-muted-foreground truncate font-medium">{session.user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />

                  <DropdownMenuItem onClick={() => router.push(`/profile`)} className="rounded-xl p-3 cursor-pointer flex items-center gap-3 font-bold hover:bg-surface text-foreground transition-colors group">
                    <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" /> My Profile
                  </DropdownMenuItem>

                    <DropdownMenuItem onSelect={() => router.push('/saved')} className="rounded-xl p-3 cursor-pointer flex items-center gap-3 font-bold hover:bg-surface text-foreground transition-colors group">
                      <Library className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" /> My Library
                    </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/50" />
                  
                  <DropdownMenuItem
                    onSelect={() => setShowSignoutConfirm(true)}
                    onClick={() => setShowSignoutConfirm(true)}
                    className="rounded-xl p-3 cursor-pointer flex items-center gap-3 font-bold text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors group"
                  >
                    <LogOut className="w-4 h-4 transition-colors" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <AlertDialog open={showSignoutConfirm} onOpenChange={setShowSignoutConfirm}>
                <AlertDialogContent className="rounded-3xl border-border bg-background">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-extrabold tracking-tight">Sign out of Stacq?</AlertDialogTitle>
                    <AlertDialogDescription className="font-medium text-muted-foreground">
                      You'll need to log in again to save stacqs or follow curators.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2 mt-4">
                    <AlertDialogCancel className="rounded-full font-bold border-border">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => signOut()} 
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full font-black px-8"
                    >
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={() => openAuthModal('login')} variant="ghost" className="rounded-full font-bold text-muted-foreground hover:text-foreground hidden sm:inline-flex">Log in</Button>
              <Button onClick={() => openAuthModal('signup')} className="bg-primary hover:bg-primary-dark text-primary-foreground rounded-full font-black px-6 shadow-emerald/20 hover:shadow-lg transition-all active:scale-95">Join Stacq</Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}