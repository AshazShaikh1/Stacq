'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';

interface TrendingStacqerCardProps {
  user: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    stats?: {
      upvotes_received?: number;
      followers_increased?: number;
      saves_received?: number;
    };
  };
  rank: number;
}

export function TrendingStacqerCard({ user, rank }: TrendingStacqerCardProps) {
  const stats = user.stats || {};
  const upvotes = stats.upvotes_received || 0;
  const followers = stats.followers_increased || 0;
  const saves = stats.saves_received || 0;

  return (
    <Link href={`/profile/${user.username}`}>
      <Card hover={true} className="p-6 text-center">
        {/* Rank Badge */}
        <div className="flex justify-center mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white ${
            rank === 1 ? 'bg-emerald' : 
            rank === 2 ? 'bg-emerald/80' : 
            'bg-emerald/60'
          }`}>
            {rank}
          </div>
        </div>

        {/* Avatar */}
        <div className="flex justify-center mb-4">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={user.display_name}
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-emerald/20 flex items-center justify-center text-2xl font-bold text-emerald">
              {user.display_name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="text-lg font-semibold text-jet-dark mb-1">
          {user.display_name}
        </h3>
        <p className="text-sm text-gray-muted mb-4">@{user.username}</p>

        {/* Stats */}
        <div className="space-y-2">
          {upvotes > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-gray-muted">{upvotes} upvotes</span>
            </div>
          )}
          {followers > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-gray-muted">+{followers} followers</span>
            </div>
          )}
          {saves > 0 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <svg className="w-4 h-4 text-emerald" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span className="text-gray-muted">{saves} saves</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

