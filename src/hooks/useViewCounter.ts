"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ViewCounterProps {
  type: "card" | "collection";
  id: string;
}

export function useViewCounter({ type, id }: ViewCounterProps) {
  const hasCounted = useRef(false);

  useEffect(() => {
    // Prevent double counting in Strict Mode or re-renders
    if (hasCounted.current) return;
    if (!id) return;

    // Check localStorage for unique view this session/browser
    const storageKey = `stacq_view_${type}_${id}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(storageKey)) {
      return; 
    }

    const increment = async () => {
      try {
        const supabase = createClient();
        const rpcName = type === "card" ? "increment_view" : "increment_collection_view";
        const paramName = type === "card" ? "card_id" : "collection_id";

        await supabase.rpc(rpcName, { [paramName]: id });
        
        hasCounted.current = true;
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, "true");
        }
      } catch (error) {
        // Silently fail view counting errors to not disrupt user experience
        console.warn("Failed to increment view count:", error);
      }
    };

    // Small delay to ensure it's a real view
    const timer = setTimeout(increment, 1000);

    return () => clearTimeout(timer);
  }, [type, id]);
}
