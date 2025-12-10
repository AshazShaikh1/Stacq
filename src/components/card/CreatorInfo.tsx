'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/contexts/AuthContext';

interface CreatorInfoProps {
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export function CreatorInfo({ creator }: CreatorInfoProps) {
  const { user } = useAuth();
  const isOwnProfile = user?.id === creator.id;

  const { isFollowing, toggleFollow, isLoading } = useFollow({
    userId: creator.id,
    initialIsFollowing: false,
  });

  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-light">
      <Link 
        href={`/profile/${creator.username}`}
        className="flex items-center gap-3 group"
      >
        <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
          {creator.avatar_url ? (
            <Image
              src={creator.avatar_url}
              alt={creator.display_name}
              fill
              className="rounded-full object-cover border border-gray-200 group-hover:border-emerald transition-colors"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-emerald/10 text-emerald flex items-center justify-center font-bold text-lg group-hover:bg-emerald/20 transition-colors">
              {creator.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div>
          <h3 className="font-bold text-jet-dark text-sm md:text-base group-hover:text-emerald transition-colors">
            {creator.display_name}
          </h3>
          <p className="text-xs text-gray-500">
            @{creator.username}
          </p>
        </div>
      </Link>

      {!isOwnProfile && user && (
        <Button
          variant={isFollowing ? 'outline' : 'primary'}
          size="sm"
          onClick={toggleFollow}
          disabled={isLoading}
          className={isFollowing ? 'text-gray-600' : ''}
        >
          {isLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
        </Button>
      )}
    </div>
  );
}