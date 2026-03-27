"use client"

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import AuthForm from "./auth-form"

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'login' | 'signup';
}

export function AuthModal({ isOpen, onOpenChange, type }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-background border-border">
        {/* Accessible hidden title and description for screen readers */}
        <DialogTitle className="sr-only">
          {type === 'login' ? 'Login to Stacq' : 'Sign up for Stacq'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Authenticate with your Google account.
        </DialogDescription>
        
        <div className="py-8 pt-10 px-6 sm:px-8">
          <AuthForm type={type} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
