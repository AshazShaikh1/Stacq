"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { completeModalTour } from "@/lib/actions/profile";

// ─── Theme — matches globals.css light palette ────────────────────────────────
const T = {
  bgCard: "#FFFFFF",
  surface: "#F8FAFC",
  border: "#E2E8F0",
  borderEmerald: "rgba(29,185,84,0.4)",
  emerald: "#1DB954",
  emeraldDark: "#1AA34A",
  emeraldGlow: "rgba(29,185,84,0.12)",
  emeraldText: "#1AA34A",
  fg: "#0F172A",
  muted: "#64748B",
};

// ─── Steps ────────────────────────────────────────────────────────────────────

interface ModalStep {
  target: string;
  headline: string;
  subtext: string;
  cta: string;
}

const STEPS: ModalStep[] = [
  {
    target: "modal-title",
    headline: "Name your vault.",
    subtext: "Be specific — 'Next.js Mastery' beats 'Coding Resources'.",
    cta: "Next →",
  },
  {
    target: "modal-description",
    headline: "Add the 'why'.",
    subtext: "What's the signal? One sharp sentence is enough.",
    cta: "Next →",
  },
  {
    target: "modal-category",
    headline: "Tag it.",
    subtext: "Helps people find your vault in Explore.",
    cta: "Next →",
  },
  {
    target: "modal-visibility",
    headline: "Choose visibility.",
    subtext: "Public vaults get discovered. Start there.",
    cta: "Got it ✓",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Pick the first matching element that is actually visible on screen
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

function waitForRect(target: string, maxMs = 2000): Promise<Rect | null> {
  return new Promise((resolve) => {
    const r = getRect(target);
    if (r) return resolve(r);
    let elapsed = 0;
    const iv = setInterval(() => {
      const found = getRect(target);
      if (found) {
        clearInterval(iv);
        resolve(found);
        return;
      }
      elapsed += 80;
      if (elapsed >= maxMs) {
        clearInterval(iv);
        resolve(null);
      }
    }, 80);
  });
}

// ─── Desktop tooltip positioning ──────────────────────────────────────────────

function getDesktopPos(
  rect: Rect | null,
  tw: number,
  th: number,
): React.CSSProperties {
  if (!rect)
    return {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
    };

  const PAD = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rTop = rect.top - window.scrollY;
  const rLeft = rect.left - window.scrollX;

  // Prefer left of field
  const leftEdge = rLeft - tw - 16;
  if (leftEdge >= PAD) {
    const top = Math.max(
      PAD,
      Math.min(rTop + rect.height / 2 - th / 2, vh - th - PAD),
    );
    return { position: "fixed", top, left: leftEdge };
  }

  // Right of field
  const rightEdge = rLeft + rect.width + 16;
  if (rightEdge + tw <= vw - PAD) {
    const top = Math.max(
      PAD,
      Math.min(rTop + rect.height / 2 - th / 2, vh - th - PAD),
    );
    return { position: "fixed", top, left: rightEdge };
  }

  // Below
  const top = Math.min(rTop + rect.height + 12, vh - th - PAD);
  let left = rLeft + rect.width / 2 - tw / 2;
  left = Math.max(PAD, Math.min(left, vw - tw - PAD));
  return { position: "fixed", top, left };
}

// ─── Desktop arrow SVG ────────────────────────────────────────────────────────

function FieldArrow({
  rect,
  tipPos,
  tw,
}: {
  rect: Rect;
  tipPos: React.CSSProperties;
  tw: number;
}) {
  const rCY = rect.top - window.scrollY + rect.height / 2;
  const rLeft = rect.left - window.scrollX;
  const rRight = rLeft + rect.width;
  const tipLeft = tipPos.left as number;
  const tipTopV = tipPos.top as number;
  const th = 155;

  const isLeft = tipLeft + tw < rLeft;
  const isRight = !isLeft && tipLeft > rRight;

  let x1: number, y1: number, x2: number, y2: number;
  if (isLeft) {
    x1 = tipLeft + tw + 4;
    y1 = tipTopV + th / 2;
    x2 = rLeft - 6;
    y2 = rCY;
  } else if (isRight) {
    x1 = tipLeft - 4;
    y1 = tipTopV + th / 2;
    x2 = rRight + 6;
    y2 = rCY;
  } else {
    x1 = tipLeft + tw / 2;
    y1 = tipTopV - 4;
    x2 = rLeft + rect.width / 2;
    y2 = rect.top - window.scrollY + rect.height + 6;
  }

  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2 - Math.abs(x2 - x1) * 0.2;

  const minX = Math.min(x1, x2, cx) - 16;
  const minY = Math.min(y1, y2, cy) - 16;
  const w = Math.max(Math.abs(Math.max(x1, x2, cx) - minX) + 16, 10);
  const h = Math.max(Math.abs(Math.max(y1, y2, cy) - minY) + 16, 10);

  const lx1 = x1 - minX,
    ly1 = y1 - minY;
  const lcx = cx - minX,
    lcy = cy - minY;
  const lx2 = x2 - minX,
    ly2 = y2 - minY;
  const angle = Math.atan2(ly2 - lcy, lx2 - lcx);
  const al = 9;
  const a1x = lx2 - al * Math.cos(angle - 0.45);
  const a1y = ly2 - al * Math.sin(angle - 0.45);
  const a2x = lx2 - al * Math.cos(angle + 0.45);
  const a2y = ly2 - al * Math.sin(angle + 0.45);

  return (
    <svg
      aria-hidden
      style={{
        position: "fixed",
        top: minY,
        left: minX,
        zIndex: 10005,
        pointerEvents: "none",
        overflow: "visible",
      }}
      width={w}
      height={h}
    >
      <path
        d={`M ${lx1} ${ly1} Q ${lcx} ${lcy} ${lx2} ${ly2}`}
        stroke={T.emerald}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="5 3"
        opacity="0.7"
      />
      <path
        d={`M ${a1x} ${a1y} L ${lx2} ${ly2} L ${a2x} ${a2y}`}
        stroke={T.emerald}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateModalTour() {
  const { session } = useAuth();

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mobile, setMobile] = useState(false);
  const [tipHeight, setTipHeight] = useState(155);

  const tipRef = useRef<HTMLDivElement>(null);
  const checkedRef = useRef(false);
  const needsTourRef = useRef(false);

  // ── Detect mobile ────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Check DB once when session available ─────────────────────────────────
  useEffect(() => {
    if (checkedRef.current || !session?.user) return;
    checkedRef.current = true;
    const uid = session.user.id;
    createClient()
      .from("profiles")
      .select("has_completed_modal_tour")
      .eq("id", uid)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // Column may not exist yet (migration pending) — default to showing tour
          needsTourRef.current = true;
          setReady(true);
          return;
        }
        const done = data?.has_completed_modal_tour ?? false;
        needsTourRef.current = !done;
        if (!done) setReady(true);
      });
  }, [session]);

  // ── Listen to modal open/close events from CreateStacqModal ─────────────
  useEffect(() => {
    const onOpen = async () => {
      if (!needsTourRef.current) return;
      await new Promise((r) => setTimeout(r, 380));
      const found = await waitForRect(STEPS[0].target);
      setRect(found);
      setStep(0);
      setExiting(false);
      setVisible(true);
    };

    const onClose = () => {
      if (!visible) return;
      setExiting(true);
      setTimeout(() => setVisible(false), 300);
    };

    window.addEventListener("stacq:create-modal-open", onOpen);
    window.addEventListener("stacq:create-modal-close", onClose);
    return () => {
      window.removeEventListener("stacq:create-modal-open", onOpen);
      window.removeEventListener("stacq:create-modal-close", onClose);
    };
  }, [visible]);

  // ── Re-anchor on step change ─────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      const found = await waitForRect(STEPS[step].target);
      if (!cancelled) setRect(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [step, visible]);

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

  // ── Scroll re-anchor ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    const onScroll = () => {
      const r = getRect(STEPS[step]?.target);
      if (r) setRect(r);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible, step]);

  // ── Dismiss ───────────────────────────────────────────────────────────────
  const dismiss = useCallback(() => {
    setExiting(true);
    needsTourRef.current = false;
    const uid = session?.user?.id;
    if (uid) completeModalTour(uid).catch(console.error);
    setTimeout(() => {
      setVisible(false);
      setReady(false);
    }, 300);
  }, [session]);

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else dismiss();
  }, [step, dismiss]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!visible || !ready) return null;

  const cur = STEPS[step];
  const vw = typeof window !== "undefined" ? window.innerWidth : 375;
  const tw = mobile ? vw - 32 : Math.min(260, vw - 32);
  const th = tipHeight;

  const tipPos: React.CSSProperties = mobile
    ? { position: "fixed", bottom: 16, left: 16, right: 16, width: "auto" }
    : getDesktopPos(rect, tw, th);

  const fade: React.CSSProperties = {
    opacity: exiting ? 0 : 1,
    transition: "opacity 0.3s ease",
  };

  // Emerald ring around the active field
  const ringStyle: React.CSSProperties | null = rect
    ? {
        position: "fixed",
        top: rect.top - window.scrollY - 3,
        left: rect.left - window.scrollX - 3,
        width: rect.width + 6,
        height: rect.height + 6,
        borderRadius: 10,
        border: `2px solid ${T.emerald}`,
        boxShadow: `0 0 0 3px rgba(29,185,84,0.10)`,
        pointerEvents: "none",
        zIndex: 10004,
        transition:
          "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease",
      }
    : null;

  return (
    <>
      {/* Emerald ring around active field */}
      {ringStyle && <div aria-hidden style={{ ...ringStyle, ...fade }} />}

      {/* Desktop arrow (hidden on mobile) */}
      {!mobile && rect && (
        <div style={fade}>
          <FieldArrow rect={rect} tipPos={tipPos} tw={tw} />
        </div>
      )}

      {/* Progress bar */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 2,
          width: `${((step + 1) / STEPS.length) * 100}%`,
          background: `linear-gradient(90deg, ${T.emerald}, ${T.emeraldDark})`,
          zIndex: 10006,
          transition: "width 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease",
          boxShadow: `0 0 8px ${T.emerald}55`,
          pointerEvents: "none",
          opacity: exiting ? 0 : 1,
        }}
      />

      {/* Skip button — desktop only (mobile skip is inline in card) */}
      {!mobile && (
        <button
          onClick={dismiss}
          aria-label="Skip form guide"
          style={{
            position: "fixed",
            top: 16,
            right: 18,
            zIndex: 10007,
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 999,
            color: T.muted,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "5px 14px",
            cursor: "pointer",
            fontFamily: "inherit",
            pointerEvents: exiting ? "none" : "all",
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
          Skip
        </button>
      )}

      {/* Tooltip / bottom sheet */}
      <div
        ref={tipRef}
        role="tooltip"
        aria-label={`Create guide: ${cur.headline}`}
        style={{
          ...tipPos,
          zIndex: 10006,
          ...(mobile ? {} : { width: tw }),
          pointerEvents: exiting ? "none" : "all",
          opacity: exiting ? 0 : 1,
          transform: exiting
            ? mobile
              ? "translateY(12px)"
              : "translateY(4px) scale(0.97)"
            : "translateY(0) scale(1)",
          transition:
            "opacity 0.3s ease, transform 0.3s ease, top 0.25s cubic-bezier(0.4,0,0.2,1), left 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Card — white with emerald top border */}
        <div
          style={{
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderTop: `2px solid ${T.emerald}`,
            borderRadius: mobile ? 18 : 16,
            padding: mobile ? "16px 18px 14px" : "18px 20px 14px",
            boxShadow: mobile
              ? "0 -4px 20px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)"
              : "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {/* Header: dots + counter + inline skip on mobile */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: mobile ? 10 : 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === step ? 18 : 5,
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
                  marginLeft: 5,
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
            {mobile && (
              <button
                onClick={dismiss}
                style={{
                  background: "transparent",
                  border: "none",
                  color: T.muted,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: "2px 0",
                  pointerEvents: exiting ? "none" : "all",
                }}
              >
                Skip
              </button>
            )}
          </div>

          {/* Content: compact row on mobile, stacked on desktop */}
          {mobile ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: T.fg,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.3,
                    marginBottom: 2,
                    fontFamily: "inherit",
                  }}
                >
                  {cur.headline}
                </h3>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: T.muted,
                    lineHeight: 1.5,
                    fontFamily: "inherit",
                  }}
                >
                  {cur.subtext}
                </p>
              </div>
              <button
                onClick={handleNext}
                style={{
                  background: `linear-gradient(135deg, ${T.emerald} 0%, ${T.emeraldDark} 100%)`,
                  color: "#fff",
                  border: "none",
                  borderRadius: 999,
                  padding: "9px 16px",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: `0 4px 12px ${T.emeraldGlow}`,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {cur.cta}
              </button>
            </div>
          ) : (
            <>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: T.fg,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.3,
                  marginBottom: 4,
                  fontFamily: "inherit",
                }}
              >
                {cur.headline}
              </h3>
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: T.muted,
                  lineHeight: 1.55,
                  marginBottom: 14,
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
                    padding: "7px 18px",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: `0 4px 12px ${T.emeraldGlow}`,
                    transition: "transform 0.15s ease",
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
