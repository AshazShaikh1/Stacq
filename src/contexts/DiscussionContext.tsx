"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type DiscussionTarget = {
  type: "collection" | "card";
  id: string;
  title?: string;
};

interface DiscussionContextType {
  activeTarget: DiscussionTarget | null;
  openDiscussion: (type: "collection" | "card", id: string, title?: string) => void;
  closeDiscussion: () => void;
}

const DiscussionContext = createContext<DiscussionContextType | undefined>(undefined);

export function DiscussionProvider({ children }: { children: React.ReactNode }) {
  const [activeTarget, setActiveTarget] = useState<DiscussionTarget | null>(null);

  const openDiscussion = useCallback(
    (type: "collection" | "card", id: string, title?: string) => {
      setActiveTarget({ type, id, title });
    },
    []
  );

  const closeDiscussion = useCallback(() => {
    setActiveTarget(null);
  }, []);

  return (
    <DiscussionContext.Provider
      value={{ activeTarget, openDiscussion, closeDiscussion }}
    >
      {children}
    </DiscussionContext.Provider>
  );
}

export function useDiscussion() {
  const context = useContext(DiscussionContext);
  if (context === undefined) {
    throw new Error("useDiscussion must be used within a DiscussionProvider");
  }
  return context;
}
