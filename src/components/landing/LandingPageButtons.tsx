'use client';

import { createContext, useContext, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { LoginModal } from '@/components/auth/LoginModal';
import { SignupModal } from '@/components/auth/SignupModal';

// Create context for shared modal state
const ModalContext = createContext<{
  openSignup: () => void;
  openLogin: () => void;
} | null>(null);

export function LandingPageButtonsProvider({ children }: { children: React.ReactNode }) {
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

function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('LandingPageButtons must be used within LandingPageButtonsProvider');
  }
  return context;
}

export function LandingPageButtons() {
  const { openSignup } = useModalContext();

  return (
    <div className="flex gap-4 justify-center">
      <Button 
        variant="primary" 
        size="lg"
        onClick={openSignup}
      >
        Get started
      </Button>
      <Link href="/explore">
        <Button variant="outline" size="lg">
          Explore Stacks
        </Button>
      </Link>
    </div>
  );
}

export function LandingPageCTAButtons() {
  const { openSignup } = useModalContext();

  return (
    <div className="flex gap-4 justify-center">
      <Button 
        variant="outline" 
        size="lg" 
        className="!bg-transparent border-2 border-white text-white hover:!bg-white hover:text-jet"
        onClick={openSignup}
      >
        Create your account
      </Button>
      <Link href="/explore">
        <Button 
          variant="outline" 
          size="lg" 
          className="bg-white border-white text-jet hover:bg-gray-light hover:border-gray-light"
        >
          Browse stacks
        </Button>
      </Link>
    </div>
  );
}
