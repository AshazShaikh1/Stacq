"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { joinWaitlist } from "@/lib/supabase/actions"
import { CheckCircle2 } from "lucide-react"

interface WaitlistModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WaitlistModal({ isOpen, onOpenChange }: WaitlistModalProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const res = await joinWaitlist(email)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess(true)
      }
    } catch (err: any) {
      setError("An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const resetAndClose = (open: boolean) => {
    onOpenChange(open)
    if (!open) {
      setTimeout(() => {
        setSuccess(false)
        setEmail("")
        setError(null)
      }, 300)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-md p-6 bg-background border-border">
        {!success ? (
          <>
            <DialogHeader className="text-center space-y-2 mb-4">
              <DialogTitle className="text-2xl font-bold tracking-tight text-center">Join the Waitlist</DialogTitle>
              <DialogDescription className="text-center text-sm text-muted-foreground">
                Stacq is currently Invite-only. Drop your email to get early access.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-destructive/15 text-destructive border border-destructive/30 rounded-md text-sm text-center">
                  {error}
                </div>
              )}
              <Input 
                type="email" 
                placeholder="Email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 focus-visible:ring-primary focus-visible:border-primary"
              />
              <Button type="submit" disabled={loading} className="w-full btn-primary h-12 text-base cursor-pointer hover:bg-primary-dark shadow-emerald">
                {loading ? "Joining..." : "Join Waitlist"}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center shadow-emerald animate-in zoom-in duration-300">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">You&apos;re on the list!</h2>
              <p className="text-muted-foreground">Keep an eye on your inbox for early access.</p>
            </div>
            <a 
              href="https://twitter.com/Stacq" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              Follow @Stacq on Twitter for updates
            </a>
            <Button onClick={() => resetAndClose(false)} variant="outline" className="w-full mt-4 h-12 cursor-pointer">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
