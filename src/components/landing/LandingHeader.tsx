'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LoginModal } from '@/components/auth/LoginModal';
import { SignupModal } from '@/components/auth/SignupModal';

export function LandingHeader() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-gray-light">
        <div className="container mx-auto px-page">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-jet rounded-lg flex items-center justify-center text-white font-bold text-lg">
                S
              </div>
              <span className="text-h2 font-bold text-jet-dark">Stack</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link 
                href="/explore" 
                className="text-body text-gray-muted hover:text-jet-dark transition-colors"
              >
                Explore
              </Link>
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
          </div>
        </div>
      </header>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        onSwitchToSignup={() => setIsSignupOpen(true)}
      />
      <SignupModal 
        isOpen={isSignupOpen} 
        onClose={() => setIsSignupOpen(false)}
        onSwitchToLogin={() => setIsLoginOpen(true)}
      />
    </>
  );
}

