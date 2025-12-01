'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Modal } from '@/components/ui/Modal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup?: () => void;
}

export function LoginModal({ isOpen, onClose, onSwitchToSignup }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setIsLoading(false);
        return;
      }

      // Success - close modal and force refresh
      onClose();
      // Force a hard navigation to ensure the page updates immediately
      window.location.href = '/';
    } catch (err) {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="text-center mb-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 bg-jet rounded-lg flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <span className="text-h2 font-bold text-jet-dark">Stack</span>
        </div>
        
        {/* Welcome Text */}
        <h2 className="text-h2 font-semibold text-jet-dark mb-2">
          Welcome back
        </h2>
        <p className="text-body text-gray-muted">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
        />

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-small text-red-600">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <a
            href="/reset-password"
            className="text-small text-jet hover:underline"
            onClick={(e) => {
              e.preventDefault();
              handleClose();
              router.push('/reset-password');
            }}
          >
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          isLoading={isLoading}
        >
          Sign in
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-body text-gray-muted">
          Don&apos;t have an account?{' '}
          <button
            onClick={() => {
              handleClose();
              onSwitchToSignup?.();
            }}
            className="text-jet font-medium hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </Modal>
  );
}

