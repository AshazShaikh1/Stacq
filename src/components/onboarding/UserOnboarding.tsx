"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

type OnboardingStep = 'welcome' | 'identity' | 'extension' | 'nudge';

export function UserOnboarding() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Identity State
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch initial profile
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .select('display_name, username, avatar_url, onboarding_completed')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setDisplayName(data.display_name || '');
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || null);
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
        
        // Safety: If somehow they are here but completed, redirect.
        // Though server gate should handle this.
        if (data.onboarding_completed) {
           router.push('/'); 
        }
      }
    };
    
    fetchProfile();
  }, [user, router]);


  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleIdentitySubmit = async () => {
    setLoading(true);
    const supabase = createClient();
    let finalAvatarUrl = avatarUrl;

    try {
      if (avatarFile && user) {
        const ext = avatarFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(path);
        finalAvatarUrl = publicUrl;
      }

      const { error } = await supabase.from('users').update({
        display_name: displayName,
        username: username,
        avatar_url: finalAvatarUrl,
      }).eq('id', user?.id);

      if (error) throw error;
      
      setStep('extension');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    const supabase = createClient();
    
    try {
      const { error } = await supabase.from('users').update({
        onboarding_completed: true
      }).eq('id', user?.id);

      if (error) throw error;
      
      router.push('/'); // OR router.refresh() to re-run server layout check?
      // router.push is safer for now.
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null; // loading state handled by auth context or page wrapper

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
        
        {/* Progress Bar */}
        <div className="h-1 bg-gray-100 flex">
          <div 
            className="bg-emerald-500 transition-all duration-500" 
            style={{ width: 
              step === 'welcome' ? '25%' : 
              step === 'identity' ? '50%' : 
              step === 'extension' ? '75%' : 
              '100%'
            }} 
          />
        </div>

        <div className="p-8 md:p-12">
          
          {/* STEP 1: WELCOME */}
          {step === 'welcome' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-stone-100 text-stone-600 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                ✨
              </div>
              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-gray-900">Welcome to Stacq</h1>
                <p className="text-gray-500 leading-relaxed">
                  The internet is noisy. Stacq is your quiet place to collect and curate content that actually matters, hand-picked by humans like you.
                </p>
              </div>
              <Button onClick={() => setStep('identity')} className="w-full" size="lg">
                Continue
              </Button>
            </div>
          )}

          {/* STEP 2: IDENTITY */}
          {step === 'identity' && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-900">Establish your Identity</h2>
                <p className="text-sm text-gray-500 mt-1">Create your presence in the community.</p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-24 h-24 rounded-full bg-stone-100 border-2 border-dashed border-gray-200 hover:border-emerald-500 cursor-pointer overflow-hidden transition-all group"
                  >
                    {avatarPreview ? (
                      <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 group-hover:text-emerald-500">
                        <span className="text-2xl">📷</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-emerald-600 font-medium mt-2 hover:underline"
                  >
                    Upload Photo
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarSelect} />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                        placeholder="janedoe"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleIdentitySubmit} 
                  className="w-full" 
                  size="lg"
                  disabled={!username || !displayName || loading}
                  isLoading={loading}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: EXTENSION (New) */}
          {step === 'extension' && (
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-4xl shadow-sm border border-emerald-100">
                  🌐
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Save Anything, Anywhere</h2>
                  <p className="text-gray-500 mt-2 leading-relaxed">
                    Stacq is designed to live where you browse. Install our browser extension to capture articles, videos, and inspiration without breaking your flow.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => window.open('https://chrome.google.com/webstore/detail/stacq', '_blank')} 
                  className="w-full" 
                  size="lg"
                  variant="primary"
                >
                   Install Extension
                </Button>
                
                <button 
                  onClick={() => setStep('nudge')}
                  className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
                >
                  Skip for now
                </button>
              </div>
              
              <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">✓ No tracking abuse</span>
                <span className="flex items-center gap-1">✓ Free</span>
              </div>
            </div>
          )}

          {/* STEP 4: NUDGE */}
          {step === 'nudge' && (
            <div className="text-center space-y-8">
              <div className="space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl animate-pulse">
                  🚀
                </div>
                <h2 className="text-2xl font-bold text-gray-900">All Set!</h2>
                <p className="text-gray-500">
                  Your journey begins now. Start by creating a collection or exploring what others are curating.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={completeOnboarding} 
                  className="w-full" 
                  size="lg"
                  isLoading={loading}
                >
                  Go to Feed
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
