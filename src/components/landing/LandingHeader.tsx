"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { LoginModal } from "@/components/auth/LoginModal";
import { SignupModal } from "@/components/auth/SignupModal";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react"; // Assuming you have lucide-react or similar, otherwise I'll use SVGs

export function LandingHeader() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-light">
        <div className="container mx-auto px-4 md:px-page">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group z-50 relative"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-button group-hover:scale-105 transition-transform duration-200">
                S
              </div>
              <span
                className={`text-xl md:text-h2 font-bold transition-colors duration-200 ${
                  isMobileMenuOpen ? "text-white" : "text-jet-dark"
                } group-hover:text-emerald`}
              >
                Stacq
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/explore"
                className="text-body text-gray-muted hover:text-emerald transition-colors duration-200 font-medium"
              >
                Explore
              </Link>
              <div className="h-6 w-px bg-gray-200"></div>
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
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden z-50 p-2 relative text-jet-dark focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-emerald md:hidden flex flex-col pt-24 px-6"
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-dark/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

            <nav className="flex flex-col gap-6 relative z-10">
              <Link
                href="/explore"
                className="text-3xl font-bold text-white hover:text-emerald-light transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Explore
              </Link>

              <div className="h-px w-full bg-white/20 my-2"></div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLoginOpen(true);
                  }}
                  className="w-full py-4 text-center rounded-xl bg-white text-emerald font-bold text-lg hover:bg-emerald-light transition-colors shadow-lg"
                >
                  Sign in
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsSignupOpen(true);
                  }}
                  className="w-full py-4 text-center rounded-xl bg-emerald-dark text-white font-bold text-lg border-2 border-white/20 hover:bg-emerald-dark/80 transition-colors"
                >
                  Create free account
                </button>
              </div>
            </nav>

            <div className="mt-auto mb-10 text-white/60 text-center text-sm">
              <p>© 2025 Stacq Platform</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
    </>
  );
}
