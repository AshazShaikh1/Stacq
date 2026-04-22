"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { X } from "lucide-react";
import { useState } from "react";

/**
 * StacqConversionBanner
 * Shown only to logged-out visitors on the Stacq detail page.
 * Contextualises the platform and drives sign-up with low friction.
 */
export function StacqConversionBanner() {
  const { session, loading, openAuthModal } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Don't render while auth is loading, or if user is signed in, or banner dismissed
  if (loading || session || dismissed) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-3 duration-500 w-full mb-4">
      <div className="bg-primary/8 border border-primary/25 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">
        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss banner"
          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-surface cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="pr-6 sm:pr-0">
          <p className="font-black text-foreground text-sm leading-snug">
            You&apos;re viewing a curated resource list on Stacq.
          </p>
          <p className="text-muted-foreground text-xs mt-0.5 font-medium">
            Sign up free to save this collection, follow the curator, and build
            your own.
          </p>
        </div>

        <button
          id="banner-save-cta"
          onClick={() => openAuthModal("signup")}
          className="shrink-0 inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs sm:text-sm rounded-full px-4 sm:px-5 h-9 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          Save this list →
        </button>
      </div>
    </div>
  );
}
