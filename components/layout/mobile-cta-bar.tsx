"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = ["/", "/login", "/signup", "/auth/callback"];

/**
 * MobileCTABar
 * A fixed bottom bar shown only on mobile to logged-out users.
 * Positioned in the thumb zone for one-tap conversion.
 * Hidden on auth pages and the landing page (which has its own CTA).
 */
export function MobileCTABar() {
  const { session, loading, openAuthModal } = useAuth();
  const pathname = usePathname();

  // Hide on desktop (md:hidden via CSS), auth pages, and for logged-in users
  if (loading || session || HIDDEN_PATHS.includes(pathname)) return null;

  return (
    <div
      id="mobile-cta-bar"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-bottom"
    >
      <div className="bg-primary px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.25)]">
        <div className="text-primary-foreground min-w-0">
          <p className="font-black text-sm leading-none">Claim your handle</p>
          <p className="text-primary-foreground/70 text-[11px] mt-0.5 font-medium truncate">
            stacq.in/
            <span className="text-primary-foreground font-bold">yourname</span>
          </p>
        </div>

        <button
          id="mobile-cta-bar-btn"
          onClick={() => openAuthModal("signup")}
          className="shrink-0 bg-white text-primary font-black text-sm rounded-full px-5 h-10 transition-all active:scale-95 cursor-pointer whitespace-nowrap hover:bg-white/90"
        >
          Get started →
        </button>
      </div>
    </div>
  );
}
