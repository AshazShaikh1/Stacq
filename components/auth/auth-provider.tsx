"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Session } from "@supabase/supabase-js";
import { AuthModal } from "./auth-modal";

interface AuthContextType {
  session: Session | null;
  loading: boolean;
  openAuthModal: (type?: "login" | "signup") => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [loading, setLoading] = useState(initialSession ? false : true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"login" | "signup">("login");

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!initialSession) {
      supabase.auth
        .getSession()
        .then(({ data: { session: fetchedSession } }) => {
          setSession((prev) =>
            prev?.access_token === fetchedSession?.access_token
              ? prev
              : fetchedSession,
          );
          setLoading(false);
        });
    }

    // isFirstEvent: the first onAuthStateChange callback is always the
    // initial session restore — NOT an actual login/logout. Skip it to
    // avoid calling router.refresh() on every page load.
    let isFirstEvent = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession((prev) =>
        prev?.access_token === currentSession?.access_token
          ? prev
          : currentSession,
      );
      setLoading(false);

      if (isFirstEvent) {
        isFirstEvent = false;
        return;
      }

      // Only refresh Server Components on real auth transitions
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [initialSession, supabase.auth, router]);

  const openAuthModal = (type: "login" | "signup" = "login") => {
    setModalType(type);
    setModalOpen(true);
  };

  const closeAuthModal = () => setModalOpen(false);

  return (
    <AuthContext.Provider
      value={{ session, loading, openAuthModal, closeAuthModal }}
    >
      {children}
      <AuthModal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        type={modalType}
      />
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
