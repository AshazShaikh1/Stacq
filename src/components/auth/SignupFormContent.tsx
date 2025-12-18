'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { motion, AnimatePresence } from 'framer-motion';

interface SignupFormContentProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  showLogo?: boolean;
  isFullPage?: boolean;
}

export function SignupFormContent({ 
  onSuccess, 
  onSwitchToLogin, 
  showLogo = true, 
  isFullPage = false 
}: SignupFormContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  // Image State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Animation Variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const checkUsernameAvailability = async (usernameToCheck: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('username')
      .ilike('username', usernameToCheck)
      .maybeSingle();
    
    if (error) {
      // If error (e.g. RLS), we assume available to avoid blocking, 
      // actual uniqueness will be enforced by DB constraint later.
      return true; 
    }
    return !data; // Returns true if no user found
  };

  const checkEmailAvailability = async (emailToCheck: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('email')
      .eq('email', emailToCheck)
      .maybeSingle();
    
    if (error) {
      return true;
    }
    return !data; // Returns true if no user found
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (step === 1) {
        // 1. Local Validation
        if (!email || !username || !password) {
          throw new Error('Please fill in all fields');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        // 2. Database Checks (Parallel)
        const [isUsernameAvailable, isEmailAvailable] = await Promise.all([
          checkUsernameAvailability(username),
          checkEmailAvailability(email)
        ]);

        if (!isUsernameAvailable) {
          throw new Error('Username is already taken');
        }
        if (!isEmailAvailable) {
          throw new Error('Email is already registered. Please sign in.');
        }

        setIsLoading(false);
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) {
      setError('Display name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();

      // 1. Sign Up (Creates User & Starts Session)
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName,
          },
        },
      });

      if (signupError) throw signupError;

      if (data.user && data.session) {
        // 2. Upload Avatar (if any)
        if (avatarFile) {
          const fileExt = avatarFile.name.split('.').pop();
          const fileName = `${data.user.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, avatarFile, { upsert: true });

          if (!uploadError) {
            const { data: publicData } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);
            
            // Sync avatar_url to auth metadata immediately
            await supabase.auth.updateUser({
              data: { avatar_url: publicData.publicUrl }
            });
          }
        }

        // 3. Success & Redirect
        const next = searchParams?.get('next') || '/';
        if (onSuccess) {
          onSuccess();
        } else if (isFullPage) {
          router.push(next);
          router.refresh();
        } else {
          window.location.href = next;
        }
      } else {
        // Fallback
        setError("Account created. Please sign in.");
        setTimeout(() => {
           if (onSwitchToLogin) onSwitchToLogin();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full bg-white flex flex-col items-center ${isFullPage ? 'min-h-screen justify-center px-4' : 'p-1'}`}>
      
      {/* Container to restrict width */}
      <div className="w-full max-w-sm"> 
        
        {/* Header */}
        <div className="text-center mb-8">
          {showLogo && (
            <Link href="/" className="inline-block group mb-4">
              <div className="flex items-center gap-2 justify-center">
                <div className="w-10 h-10 bg-emerald rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
                  S
                </div>
                <span className="text-2xl font-bold text-jet-dark">Stacq</span>
              </div>
            </Link>
          )}
          <h2 className="text-xl font-bold text-jet-dark">
            {step === 1 ? "Create your account" : "Additional details"}
          </h2>
          <p className="text-sm text-gray-muted mt-1">
            {step === 1 ? "Start curating your internet" : "Tell us a bit about yourself"}
          </p>
        </div>

        <div className="relative overflow-hidden min-h-[320px]">
          <AnimatePresence initial={false} custom={step} mode='wait'>
            
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={step}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                className="w-full"
              >
                <form onSubmit={handleContinue} className="space-y-4">
                  <Input
                    type="email"
                    label="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    disabled={isLoading}
                  />
                  
                  <Input
                    type="text"
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="johndoe"
                    required
                    disabled={isLoading}
                  />

                  <PasswordInput
                    id="signup-pass"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    disabled={isLoading}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full justify-center py-3 text-base bg-emerald hover:bg-emerald-dark mt-6"
                    isLoading={isLoading}
                  >
                    Continue
                  </Button>
                </form>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={step}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
                className="w-full"
              >
                <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-2 group cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                        disabled={isLoading}
                      />
                      <div className={`w-full h-full rounded-full overflow-hidden border-2 ${error ? 'border-red-500' : 'border-gray-200'} group-hover:border-emerald transition-colors relative bg-gray-50 flex items-center justify-center`}>
                        {avatarPreview ? (
                          <Image 
                            src={avatarPreview} 
                            alt="Preview" 
                            fill 
                            className="object-cover" 
                          />
                        ) : (
                          <span className="text-4xl text-gray-300 group-hover:text-emerald-400 transition-colors">+</span>
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-100">
                        <svg className="w-4 h-4 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">Add profile photo (optional)</p>
                  </div>

                  <Input
                    type="text"
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. John Doe"
                    required
                    autoFocus
                    disabled={isLoading}
                  />

                  <div className="space-y-3 mt-6">
                    <Button
                      type="submit"
                      variant="primary"
                      className="w-full justify-center py-3 text-base bg-emerald hover:bg-emerald-dark"
                      isLoading={isLoading}
                    >
                      Create Account
                    </Button>

                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full text-sm text-gray-500 hover:text-jet-dark transition-colors py-2"
                      disabled={isLoading}
                    >
                      ← Back
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center animate-pulse">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="text-center text-sm text-gray-muted mt-6">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-emerald font-semibold hover:underline"
            >
              Sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}