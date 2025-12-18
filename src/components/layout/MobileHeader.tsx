'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SearchIcon } from '@/components/ui/Icons';
import { AccountDropdown } from './AccountDropdown';
import { SearchAutocomplete } from '@/components/search/SearchAutocomplete';

export function MobileHeader() {
  const { user } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-light z-40 px-4 flex items-center justify-between">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-emerald rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
          S
        </div>
        <span className="font-bold text-xl text-jet-dark tracking-tight">Stacq</span>
      </Link>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Mobile Search (inline, no redirect) */}
        <button
          type="button"
          className="p-2 text-gray-muted hover:text-jet-dark transition-colors"
          onClick={() => setIsSearchOpen((open) => !open)}
          aria-label="Search"
        >
          <SearchIcon size={22} />
        </button>

        {user ? (
          // Reuse desktop account dropdown on mobile for a consistent profile menu
          <div className="flex items-center">
            <AccountDropdown user={user} />
          </div>
        ) : (
          <Link
            href="/login"
            className="px-4 py-1.5 rounded-full bg-emerald/10 text-emerald text-sm font-bold"
          >
            Login
          </Link>
        )}
      </div>
      {isSearchOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 px-4 pb-2 bg-white border-b border-gray-light shadow-md">
          <SearchAutocomplete />
        </div>
      )}
    </header>
  );
}