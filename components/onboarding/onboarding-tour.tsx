"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { completeTour } from "@/lib/actions/profile";

// ─── Theme — matches globals.css light palette ────────────────────────────────
const T = {
  bgCard: "#FFFFFF", // --background / --card
  surface: "#F8FAFC", // --surface
  border: "#E2E8F0", // --border
  borderEmerald: "rgba(29,185,84,0.35)", // emerald border accent
  emerald: "#1DB954", // --primary (light mode)
  emeraldDark: "#1AA34A", // --primary-dark
  emeraldGlow: "rgba(29,185,84,0.12)",
  emeraldText: "#1AA34A", // readable emerald on white
  overlay: "rgba(15,23,42,0.72)", // dark spotlight — kept intentionally
  fg: "#0F172A", // --foreground
  muted: "#64748B", // --muted-foreground
  ring: "rgba(29,185,84,0.5)",
};

// ─── Steps ────────────────────────────────────────────────────────────────────

interface TourStep {
  target: string;
  headline: string;
  subtext: string;
  cta: string;
}

const STEPS: TourStep[] = [
  {
    target: "sidebar-create",
    headline: "Create your first Stacq.",
    subtext: "Curate tools, articles, and links into a single shareable vault.",
    cta: "Next →",
  },
  {
    target: "sidebar-explore",
    headline: "Explore more Stacqs.",
    subtext: "Discover what other curators are building across every topic.",
    cta: "Next →",
  },
  {
    target: "sidebar-saved",
    headline: "Save useful Stacqs.",
    subtext: "Bookmark vaults you love. Access them anytime from here.",
    cta: "Next →",
  },
  {
    target: "sidebar-profile",
    headline: "Your public profile.",
    subtext: "Every Stacq you create lives here. Share it. Own it.",
    cta: "Done ✓",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Pick the first element with this data-tour that is actually visible.
// Both sidebar & bottom-nav share the same data-tour names; on mobile
// the sidebar is display:none so its rect is {0,0,0,0} — we skip it.
function getRect(target: string): Rect | null {
  const els = document.querySelectorAll(`[data-tour="${target}"]`);
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 || r.height > 0) {
      return {
        top: r.top + window.scrollY,
        left: r.left + window.scrollX,
        width: r.width,
        height: r.height,
      };
    }
  }
  return null;
}

function isMobileWidth() {
  return typeof window !== "undefined" && window.innerWidth < 640;
}

// ─── Tooltip positioning ──────────────────────────────────────────────────────

function tooltipPos(
  rect: Rect | null,
  tw: number,
  th: number,
): React.CSSProperties {
  if (!rect) {
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
    };
  }

  const PAD = 16;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = isMobileWidth();
  const rTop = rect.top - window.scrollY;
  const rLeft = rect.left - window.scrollX;

  // If target is in the bottom 35% of viewport (bottom nav area), go ABOVE
  const targetIsAtBottom = rTop > vh * 0.65;

  let top: number;
  if (targetIsAtBottom) {
    top = Math.max(PAD, rTop - th - PAD - 8);
  } else if (vh - (rTop + rect.height) >= th + PAD) {
    top = rTop + rect.height + PAD;
  } else if (rTop >= th + PAD) {
    top = rTop - th - PAD;
  } else {
    top = Math.max(PAD, (vh - th) / 2);
  }

  let left: number;
  if (mobile) {
    left = (vw - tw) / 2;
  } else {
    left = rLeft + rect.width / 2 - tw / 2;
    left = Math.max(PAD, Math.min(left, vw - tw - PAD));
  }

  return { position: "fixed", top, left };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingTour() {
  const { session, loading: authLoading } = useAuth();

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mobile, setMobile] = useState(false);
  const [tipHeight, setTipHeight] = useState(180);

  const tipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // ── Auth + profile check ─────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading || !session?.user) return;
    const uid = session.user.id;
    createClient()
      .from("profiles")
      .select("has_completed_tour")
      .eq("id", uid)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // Column may not exist yet (migration pending) — default to showing tour
          setReady(true);
          return;
        }
        const done = data?.has_completed_tour ?? false;
        if (!done) setReady(true);
      });
  }, [session, authLoading]);

  // ── Detect mobile ────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Rect tracking ────────────────────────────────────────────────────────
  const refreshRect = useCallback(() => {
    const target = STEPS[step]?.target;
    if (!target) return;
    let attempts = 0;
    const poll = () => {
      const r = getRect(target);
      if (r) {
        setRect(r);
        return;
      }
      if (++attempts < 25) requestAnimationFrame(poll);
    };
    poll();
  }, [step]);

  const scheduleRefresh = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(refreshRect);
  }, [refreshRect]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      refreshRect();
      setVisible(true);
    }, 500);
    return () => clearTimeout(t);
  }, [ready, refreshRect]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(refreshRect, 100);
    return () => clearTimeout(t);
  }, [step, visible, refreshRect]);

  useEffect(() => {
    if (!visible) return;
    window.addEventListener("scroll", scheduleRefresh, { passive: true });
    window.addEventListener("resize", scheduleRefresh, { passive: true });
    return () => {
      window.removeEventListener("scroll", scheduleRefresh);
      window.removeEventListener("resize", scheduleRefresh);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [visible, scheduleRefresh]);

  // ── Track tooltip height via ResizeObserver (never read ref during render) ──
  useEffect(() => {
    const el = tipRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight;
      if (h > 0) setTipHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible, step]);

  // ── Dismiss ──────────────────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    setExiting(true);
    const uid = session?.user?.id;
    if (uid) completeTour(uid).catch(console.error);
    setTimeout(() => {
      setVisible(false);
      setReady(false);
    }, 360);
  }, [session]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  }, [step, dismiss]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (!ready || !visible) return null;

  const cur = STEPS[step];
  const vw = window.innerWidth;
  const tw = mobile ? Math.min(vw - 32, 340) : Math.min(300, vw - 32);
  const th = tipHeight;
  const pos = tooltipPos(rect, tw, th);
  const PAD = mobile ? 8 : 10;

  const spotStyle: React.CSSProperties = rect
    ? {
        position: "absolute",
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
        borderRadius: mobile ? 12 : 14,
        boxShadow: `0 0 0 9999px ${T.overlay}`,
        outline: `2px solid ${T.ring}`,
        outlineOffset: 2,
        pointerEvents: "none",
        zIndex: 9998,
        transition:
          "top 0.3s cubic-bezier(0.4,0,0.2,1), left 0.3s ease, width 0.3s ease, height 0.3s ease",
      }
    : { display: "none" };

  const fade: React.CSSProperties = {
    opacity: exiting ? 0 : 1,
    transition: "opacity 0.36s ease",
  };

  return (
    <>
      {/* Interaction blocker */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9997,
          background: "transparent",
          pointerEvents: exiting ? "none" : "all",
          ...fade,
        }}
      />

      {/* Spotlight */}
      <div
        aria-hidden
        style={{
          ...spotStyle,
          opacity: exiting ? 0 : 1,
          transition: `${spotStyle.transition ?? ""}, opacity 0.36s ease`,
        }}
      />

      {/* Fallback dim */}
      {!rect && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            background: T.overlay,
            zIndex: 9997,
            pointerEvents: "none",
            ...fade,
          }}
        />
      )}

      {/* Emerald progress bar */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 2,
          width: `${((step + 1) / STEPS.length) * 100}%`,
          background: `linear-gradient(90deg, ${T.emerald}, ${T.emeraldDark})`,
          zIndex: 10002,
          transition:
            "width 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.36s ease",
          boxShadow: `0 0 8px ${T.emerald}55`,
          pointerEvents: "none",
          opacity: exiting ? 0 : 1,
        }}
      />

      {/* Skip — bottom-center on mobile, top-right on desktop */}
      <button
        onClick={dismiss}
        aria-label="Skip tour"
        style={{
          position: "fixed",
          ...(mobile
            ? { bottom: 104, left: "50%", transform: "translateX(-50%)" }
            : { top: 16, right: 18 }),
          zIndex: 10003,
          background: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: 999,
          color: T.muted,
          fontSize: mobile ? 12 : 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: mobile ? "7px 18px" : "5px 14px",
          cursor: "pointer",
          fontFamily: "inherit",
          pointerEvents: exiting ? "none" : "all",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          ...fade,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = T.emerald;
          e.currentTarget.style.borderColor = T.emerald;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = T.muted;
          e.currentTarget.style.borderColor = T.border;
        }}
      >
        Skip tour
      </button>

      {/* Tooltip card */}
      <div
        ref={tipRef}
        role="dialog"
        aria-label={`Tour step ${step + 1}`}
        style={{
          ...pos,
          zIndex: 10001,
          width: tw,
          pointerEvents: exiting ? "none" : "all",
          opacity: exiting ? 0 : 1,
          transform: exiting
            ? "translateY(6px) scale(0.97)"
            : "translateY(0) scale(1)",
          transition:
            "opacity 0.36s ease, transform 0.36s ease, top 0.3s cubic-bezier(0.4,0,0.2,1), left 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Upward caret (desktop only, when tooltip is below the target) */}
        {!mobile &&
          rect &&
          (() => {
            const rTop = rect.top - window.scrollY;
            const isBelow =
              typeof pos.top === "number" && pos.top > rTop + rect.height;
            if (!isBelow) return null;
            return (
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: -7,
                  left: 28,
                  width: 14,
                  height: 14,
                  background: T.bgCard,
                  border: `1px solid ${T.border}`,
                  borderRight: "none",
                  borderBottom: "none",
                  transform: "rotate(45deg)",
                  borderRadius: "3px 0 0 0",
                  zIndex: 1,
                }}
              />
            );
          })()}

        {/* Card — white with emerald accent on top */}
        <div
          style={{
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderTop: `2px solid ${T.emerald}`,
            borderRadius: mobile ? 16 : 18,
            padding: mobile ? "16px 18px 14px" : "20px 22px 16px",
            boxShadow:
              "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {/* Step dots + counter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              marginBottom: mobile ? 10 : 14,
            }}
          >
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 20 : 5,
                  height: 5,
                  borderRadius: 999,
                  background: i === step ? T.emerald : T.border,
                  transition: "width 0.3s ease, background 0.3s ease",
                  flexShrink: 0,
                }}
              />
            ))}
            <span
              style={{
                marginLeft: 6,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: T.emeraldText,
                fontFamily: "inherit",
              }}
            >
              {step + 1} / {STEPS.length}
            </span>
          </div>

          <h3
            style={{
              fontSize: mobile ? 15 : 16,
              fontWeight: 900,
              color: T.fg,
              letterSpacing: "-0.025em",
              lineHeight: 1.3,
              marginBottom: 4,
              fontFamily: "inherit",
            }}
          >
            {cur.headline}
          </h3>
          <p
            style={{
              fontSize: mobile ? 12 : 13,
              fontWeight: 500,
              color: T.muted,
              lineHeight: 1.55,
              marginBottom: mobile ? 14 : 18,
              fontFamily: "inherit",
            }}
          >
            {cur.subtext}
          </p>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleNext}
              style={{
                background: `linear-gradient(135deg, ${T.emerald} 0%, ${T.emeraldDark} 100%)`,
                color: "#fff",
                border: "none",
                borderRadius: 999,
                padding: mobile ? "9px 22px" : "8px 20px",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.02em",
                cursor: "pointer",
                fontFamily: "inherit",
                boxShadow: `0 4px 14px ${T.emeraldGlow}`,
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {cur.cta}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
