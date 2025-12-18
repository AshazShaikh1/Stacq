"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LoginModal } from "@/components/auth/LoginModal";
import { SignupModal } from "@/components/auth/SignupModal";

// 1. Define the Context Type
type ModalContextType = {
  openSignup: () => void;
  openLogin: () => void;
};

// 2. Create Context
const ModalContext = createContext<ModalContextType | null>(null);

// 3. Create the Provider
export function LandingPageButtonsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  const openSignup = () => {
    setIsSignupOpen(true);
    setIsLoginOpen(false);
  };

  const openLogin = () => {
    setIsLoginOpen(true);
    setIsSignupOpen(false);
  };

  return (
    <ModalContext.Provider value={{ openSignup, openLogin }}>
      {children}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToSignup={() => {
          setIsLoginOpen(false);
          setIsSignupOpen(true);
        }}
      />

      <SignupModal
        isOpen={isSignupOpen}
        onClose={() => setIsSignupOpen(false)}
        onSwitchToLogin={() => {
          setIsSignupOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </ModalContext.Provider>
  );
}

// 4. Custom Hook for easy access
export function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error(
      "useModalContext must be used within a LandingPageButtonsProvider"
    );
  }
  return context;
}

// 5. Component: Header Buttons (Get Started / Browse)
export function LandingPageButtons() {
  const { openSignup } = useModalContext();

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button variant="primary" size="lg" onClick={openSignup}>
        Get started
      </Button>
      <Link href="/explore">
        <Button variant="outline" size="lg">
          Browse Collections
        </Button>
      </Link>
    </div>
  );
}

// 6. Component: CTA Buttons (Transparent/White variants)
export function LandingPageCTAButtons() {
  const { openSignup } = useModalContext();

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button
        variant="outline"
        size="lg"
        className="!bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:!bg-white hover:!text-emerald-600 hover:border-white shadow-lg transition-all"
        onClick={openSignup}
      >
        Create your account
      </Button>
      <Link href="/explore">
        <Button
          variant="outline"
          size="lg"
          className="bg-white border-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-50 hover:text-emerald-700 shadow-lg transition-all"
        >
          Browse collections
        </Button>
      </Link>
    </div>
  );
}
