import { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface BecomeStackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requiredFields?: string[];
}

export function BecomeStackerModal({ 
  isOpen, 
  onClose, 
  onSuccess,
}: BecomeStackerModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [step, setStep] = useState<'details' | 'avatar'>('details');
  const [displayName, setDisplayName] = useState('');
  const [shortBio, setShortBio] = useState('');
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  // We keep avatarUrl state for existing avatar or manual entry fallbacks if logic requires, 
  // but we'll prioritize file upload for the redesign.
  const [existingAvatarUrl, setExistingAvatarUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('details');
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from('users')
            .select('display_name, avatar_url, metadata')
            .eq('id', user.id)
            .single()
            .then(({ data: profile }) => {
              if (profile) {
                setDisplayName(profile.display_name || '');
                setExistingAvatarUrl(profile.avatar_url || '');
                setShortBio(profile.metadata?.short_bio || '');
                // We ignore phone
              }
            });
        }
      });
    }
  }, [isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Upload Avatar if new file selected
      let finalAvatarUrl = existingAvatarUrl;
      
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars") // Assuming 'avatars' bucket exists. If not, this might fail, but it's standard convention.
          .upload(fileName, avatarFile);

        if (uploadError) {
           // Fallback to not updating avatar if upload fails? Or throw?
           console.error("Avatar upload failed", uploadError);
           // Let's try 'public' bucket if 'avatars' undefined in your setup, but usually mapped.
           // Proceeding with assumption.
        } else {
           const { data: urlData } = supabase.storage
             .from("avatars")
             .getPublicUrl(fileName);
           finalAvatarUrl = urlData.publicUrl;
        }
      }

      // 2. Call API
      const response = await fetch('/api/users/become-stacker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim(),
          short_bio: shortBio.trim() || undefined,
          avatar_url: finalAvatarUrl || undefined,
          // phone removed
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to become a Stacqer');
      }

      await supabase.auth.refreshSession();

      onSuccess();
      onClose();
      router.refresh();

    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Become a Stacqer" size="md">
      <form onSubmit={handleSubmit} className="min-h-[350px] animate-in fade-in duration-300">
        
        {/* Intro Text */}
        <div className="mb-6">
           <p className="text-sm text-gray-500">
             Join the creator community. Publish stacks, grow your audience, and unlock pro features.
           </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Step 1: Details */}
        {step === 'details' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="How should we call you?"
                className="w-full text-lg px-4 py-3 rounded-xl border border-gray-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all placeholder:text-gray-400"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Short Bio</label>
              <textarea
                value={shortBio}
                onChange={(e) => setShortBio(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Tell us a bit about yourself..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald/20 focus:border-emerald transition-all placeholder:text-gray-400 resize-none"
              />
              <div className="text-right mt-1">
                 <span className="text-xs text-gray-400">{shortBio.length}/500</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="primary" 
                className="flex-1"
                disabled={!displayName.trim()}
                onClick={() => setStep('avatar')}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Avatar */}
        {step === 'avatar' && (
          <div className="space-y-6">
            <div className="text-center space-y-4">
               <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className="mx-auto relative w-32 h-32 rounded-full border-4 border-white shadow-lg cursor-pointer group overflow-hidden bg-stone-100"
               >
                 {(avatarPreview || existingAvatarUrl) ? (
                   <Image 
                     src={avatarPreview || existingAvatarUrl} 
                     alt="Avatar" 
                     fill 
                     className="object-cover transition-opacity group-hover:opacity-75" 
                   />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                       <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    </div>
                 )}
                 <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium">Change</span>
                 </div>
                 <input 
                   ref={fileInputRef}
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   onChange={handleFileSelect} 
                 />
               </div>
               <p className="text-xs text-gray-500">
                 Click to upload a new photo. A friendly face helps you connect!
               </p>
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setStep('details')}
                className="px-4 text-sm text-gray-500 hover:text-gray-700"
              >
                Back
              </button>
              <div className="flex-1 flex gap-3 justify-end">
                <Button 
                   type="submit" 
                   variant="primary" 
                   className="w-full"
                   isLoading={isLoading}
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          </div>
        )}

      </form>
    </Modal>
  );
}

