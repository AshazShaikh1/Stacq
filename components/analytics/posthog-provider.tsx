"use client";

/**
 * PostHogProvider
 * ────────────────────────────────────────────────────────────────────────────
 * Lazy-initialises PostHog after hydration to prevent React hydration
 * mismatches. PHProvider is never rendered during SSR — it only mounts after
 * the first client paint via a `mounted` state gate.
 *
 * Traffic is routed through /ingest/* (Next.js proxy → us.i.posthog.com)
 * so ad blockers cannot intercept it. See next.config.ts rewrites.
 */

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// ─── Page view tracker ────────────────────────────────────────────────────────
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && posthog.__loaded) {
      let url = window.location.origin + pathname;
      if (searchParams?.toString()) url += `?${searchParams.toString()}`;
      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams]);

  return null;
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  // Gate: only render PHProvider after first client mount.
  // This prevents the server-rendered React tree from including PHProvider,
  // which would shift base-ui ID generation and cause hydration mismatches.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Only run PostHog in production — no network calls in local dev
    if (process.env.NODE_ENV !== "production") return;
    if (!posthogKey || posthogKey.trim() === "") return;

    posthog.init(posthogKey, {
      // Proxy through our domain — bypasses ad blockers.
      api_host: "/ingest",
      ui_host: "https://us.posthog.com",

      capture_pageview: false, // handled manually in PageViewTracker
      capture_pageleave: true,
      autocapture: true,

      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.debug();
      },

      // Disable asset-CDN features — these load scripts from
      // us-assets.posthog.com which may not resolve on all networks.
      // Core event capture (pageviews, custom events) still works.
      disable_session_recording: true,
      enable_recording_console_log: false,
      disable_surveys: true,
      // @ts-expect-error — not yet in PostHog typedefs
      disable_dead_clicks: true,
      disable_web_vitals: true,

      respect_dnt: true,
      ip: false,
      persistence: "localStorage",
      bootstrap: {},
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Before mount: render children bare — identical to the server render.
  // After mount: wrap with PHProvider so PostHog context is available.
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      {children}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </PHProvider>
  );
}
