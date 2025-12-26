'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalCreateModal } from '@/components/create/GlobalCreateModal';
import { HomeIcon, ExploreIcon, CreateIcon } from '@/components/ui/Icons';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

// Simple Saved Icon
function SavedIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [profile, setProfile] = useState<{
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path);

  // 1. Load profile from DB so avatar updates propagate everywhere
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const supabase = createClient();
    supabase
      .from('users')
      .select('username, display_name, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // fall back silently to auth metadata below
          console.error('Failed to load profile:', error);
          return;
        }
        if (data) {
          setProfile({
            username: data.username ?? null,
            display_name: data.display_name ?? null,
            avatar_url: data.avatar_url ?? null,
          });
        }
      });
  }, [user?.id]);

  // 2. Get safe user data (DB profile first, then auth metadata)
  const metadata = user?.user_metadata || {};
  const username =
    profile?.username || metadata.username || user?.id || null;
  const avatarUrl =
    profile?.avatar_url || metadata.avatar_url || null;
  const profileLink = username ? `/profile/${username}` : '/login';
  
  // 3. Fallback Initial
  const displayName =
    profile?.display_name ||
    metadata.display_name ||
    metadata.username ||
    user?.email ||
    'U';
  const initial = displayName[0]?.toUpperCase() || 'U';

  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-light pb-safe-area shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">
          
          {/* Home */}
          <Link 
            href="/" 
            className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
              isActive('/') && pathname === '/'
                ? 'text-emerald'
                : 'text-gray-muted hover:bg-emerald/10 hover:text-emerald'
            }`}
          >
            <HomeIcon size={24} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          
          {/* Explore */}
          <Link 
            href="/explore" 
            className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
              isActive('/explore')
                ? 'text-emerald'
                : 'text-gray-muted hover:bg-emerald/10 hover:text-emerald'
            }`}
          >
            <ExploreIcon size={24} />
            <span className="text-[10px] font-medium">Explore</span>
          </Link>

          {/* Create Button */}
          <div className="relative -top-5">
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center w-14 h-14 bg-emerald text-white rounded-full shadow-lg border-4 border-white active:scale-95 transition-transform"
              >
                <CreateIcon size={24} />
              </button>
          </div>

          {/* Saved */}
          <Link 
            href="/saved" 
            className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
              isActive('/saved')
                ? 'text-emerald'
                : 'text-gray-muted hover:bg-emerald/10 hover:text-emerald'
            }`}
          >
            <SavedIcon size={24} />
            <span className="text-[10px] font-medium">Saved</span>
          </Link>

          {/* Profile */}
          <Link 
            href={profileLink} 
            className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
              isActive(profileLink)
                ? 'text-emerald'
                : 'text-gray-muted hover:bg-emerald/10 hover:text-emerald'
            }`}
          >
            <div className={`w-6 h-6 rounded-full overflow-hidden border-2 flex items-center justify-center ${
              isActive(profileLink) ? 'border-emerald' : 'border-transparent'
            }`}>
                {/* 3. Robust Avatar with Fallback */}
                {user && avatarUrl && !imgError ? (
                   <Image 
                     src={avatarUrl} 
                     alt="Profile" 
                     width={24}
                     height={24}
                     className="w-full h-full object-cover"
                     onError={() => setImgError(true)}
                   />
                ) : (
                   <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold ${isActive(profileLink) ? 'bg-emerald text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {user ? initial : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      )}
                   </div>
                )}
            </div>
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        </div>
      </div>

      <GlobalCreateModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </>
  );
}