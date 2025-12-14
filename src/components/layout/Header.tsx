"use client";

import { useState, lazy, Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { AccountDropdown } from "./AccountDropdown";
import { NotificationDropdown } from "./NotificationDropdown";
import { SearchAutocomplete } from "@/components/search/SearchAutocomplete"; // <-- IMPORT THIS

const LoginModal = lazy(() =>
  import("@/components/auth/LoginModal").then((m) => ({
    default: m.LoginModal,
  }))
);
const SignupModal = lazy(() =>
  import("@/components/auth/SignupModal").then((m) => ({
    default: m.SignupModal,
  }))
);

export function Header() {
  const { user, isLoading } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-light w-full">
      <div className="px-6 md:px-8 h-16 flex items-center justify-between gap-4 w-full">
        {/* Search Bar Area */}
        <div className="flex-1 max-w-2xl">
          <SearchAutocomplete /> {/* <-- USE THE NEW COMPONENT */}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {isLoading ? (
            <div className="w-20 h-10 bg-gray-light animate-pulse rounded-md" />
          ) : user ? (
            <>
              <NotificationDropdown user={user} />
              <AccountDropdown user={user} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLoginOpen(true)}
              >
                Sign in
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsSignupOpen(true)}
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </div>

      {isLoginOpen && (
        <Suspense fallback={null}>
          <LoginModal
            isOpen={isLoginOpen}
            onClose={() => setIsLoginOpen(false)}
            onSwitchToSignup={() => {
              setIsLoginOpen(false);
              setIsSignupOpen(true);
            }}
          />
        </Suspense>
      )}

      {isSignupOpen && (
        <Suspense fallback={null}>
          <SignupModal
            isOpen={isSignupOpen}
            onClose={() => setIsSignupOpen(false)}
            onSwitchToLogin={() => {
              setIsSignupOpen(false);
              setIsLoginOpen(true);
            }}
          />
        </Suspense>
      )}
    </header>
  );
}
