"use client";

import { useViewCounter } from "@/hooks/useViewCounter";

interface ViewTrackerProps {
  type: "card" | "collection";
  id: string;
}

export function ViewTracker({ type, id }: ViewTrackerProps) {
  useViewCounter({ type, id });
  return null; // Invisible component
}
