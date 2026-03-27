"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { signInWithGoogle, signOut } from "@/lib/supabase/actions"
import { Button } from "@/components/ui/button"
import { AuthModal } from "@/components/auth/auth-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Session } from "@supabase/supabase-js"

export function Navbar() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalType, setAuthModalType] = useState<'login' | 'signup'>('login')

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="border-b bg-surface sticky top-0 z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-emerald hover:scale-105 transition-all duration-200 hover:shadow-lg cursor-pointer">
          S
        </a>
        <div className="flex items-center gap-4">
          {loading ? null : session ? (
            <div className="flex items-center gap-4">
              <Link href="/stacq/new" className="btn-primary hidden md:inline-flex">
                Create Stacq
              </Link>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors">
                    <Avatar className="h-10 w-10 border border-border shadow-sm">
                      <AvatarImage
                        src={session.user.user_metadata.avatar_url}
                        alt={session.user.user_metadata.full_name || "User"}
                      />
                      <AvatarFallback className="bg-primary-light text-primary-dark font-medium">
                        {session.user.user_metadata.full_name?.charAt(0).toUpperCase() ||
                          session.user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">
                          {session.user.user_metadata.full_name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="md:hidden cursor-pointer">
                      <Link href="/stacq/new" className="w-full text-primary font-medium">Create Stacq</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="md:hidden" />
                    <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer transition-colors duration-200">
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button onClick={() => signOut()} variant="outline" className="btn-outline font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 hidden sm:inline-flex">
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 md:gap-4">
              <Button onClick={() => { setAuthModalType('login'); setAuthModalOpen(true); }} variant="ghost" className="font-semibold text-foreground hover:bg-transparent hover:text-primary transition-colors cursor-pointer px-2 sm:px-4">
                Log in
              </Button>
              <Button onClick={() => { setAuthModalType('signup'); setAuthModalOpen(true); }} className="btn-primary cursor-pointer hover:bg-primary-dark px-3 sm:px-4 text-sm sm:text-base">
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>
      <AuthModal isOpen={authModalOpen} onOpenChange={setAuthModalOpen} type={authModalType} />
    </nav>
  )
}
