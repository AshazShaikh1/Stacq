"use client";

/**
 * WebVitalsLogger
 * ────────────────────────────────────────────────────────────────────────────
 * • Development: pretty-prints Core Web Vitals to the browser console
 *   with colour-coded ratings (Good / Needs Improvement / Poor).
 * • Production: sends each vital to PostHog as a `web_vital` event so you
 *   can build dashboards and alert on regressions.
 *
 * Vitals tracked: LCP, CLS, INP (replaces FID), FID, TTFB
 *
 * Mounted once in app/layout.tsx. Zero performance cost — the web-vitals
 * library is only loaded after hydration inside a useEffect.
 */

import { useEffect } from "react";
import type { Metric } from "web-vitals";

// Thresholds from https://web.dev/vitals/
const THRESHOLDS: Record<string, [number, number]> = {
  LCP: [2500, 4000], // ms
  CLS: [0.1, 0.25], // unitless
  INP: [200, 500], // ms
  FID: [100, 300], // ms
  TTFB: [800, 1800], // ms
};

function rating(
  name: string,
  value: number,
): "good" | "needs-improvement" | "poor" {
  const [good, poor] = THRESHOLDS[name] ?? [0, Infinity];
  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

const COLORS = {
  good: "color:#16a34a;font-weight:bold",
  "needs-improvement": "color:#f59e0b;font-weight:bold",
  poor: "color:#ef4444;font-weight:bold",
  label: "color:#64748b;font-weight:bold",
  reset: "color:inherit",
};

function sendToPostHog(metric: Metric) {
  // Only send in production and only if PostHog is initialised
  if (process.env.NODE_ENV !== "production" || typeof window === "undefined")
    return;

  // Lazy import posthog to keep this module lean in non-PostHog setups
  import("posthog-js").then(({ default: posthog }) => {
    if (!posthog.__loaded) return;
    posthog.capture("web_vital", {
      metric_name: metric.name,
      metric_value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value,
      ),
      metric_rating: rating(metric.name, metric.value),
      metric_id: metric.id,
      page_url: window.location.pathname,
    });
  });
}

function logToConsole(metric: Metric) {
  if (process.env.NODE_ENV !== "development") return;
  const r = rating(metric.name, metric.value);
  const value =
    metric.name === "CLS"
      ? metric.value.toFixed(4)
      : `${Math.round(metric.value)}ms`;

  console.log(
    `%c[Web Vitals]%c ${metric.name} %c${r.toUpperCase()}%c — ${value}`,
    COLORS.label,
    COLORS.reset,
    COLORS[r],
    COLORS.reset,
  );
}

export function WebVitalsLogger() {
  useEffect(() => {
    import("web-vitals").then(({ onCLS, onINP, onLCP, onTTFB }) => {
      const handle = (metric: Metric) => {
        logToConsole(metric);
        sendToPostHog(metric);
      };
      onCLS(handle);
      onINP(handle);
      onLCP(handle);
      onTTFB(handle);
    });
  }, []);

  return null;
}
