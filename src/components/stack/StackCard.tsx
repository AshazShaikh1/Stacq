'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/Card';

interface StackCardProps {
  stack: {
    id: string;
    title: string;
    description?: string;
    cover_image_url?: string;
    owner_id: string;
    stats: {
      views: number;
      upvotes: number;
      saves: number;
      comments: number;
    };
    owner?: {
      username: string;
      display_name: string;
      avatar_url?: string;
    };
  };
}

export function StackCard({ stack }: StackCardProps) {
  const displayName = stack.owner?.display_name || 'Unknown';
  const username = stack.owner?.username || 'unknown';

  return (
    <Link href={`/stack/${stack.id}`}>
      <Card hover className="overflow-hidden h-full flex flex-col">
        {/* Cover Image */}
        {stack.cover_image_url ? (
          <div className="relative w-full h-48 bg-gray-light">
            <Image
              src={stack.cover_image_url}
              alt={stack.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-jet/10 to-gray-light flex items-center justify-center">
            <div className="text-4xl">📚</div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-h2 font-semibold text-jet-dark mb-2 line-clamp-2">
            {stack.title}
          </h3>

          {/* Description */}
          {stack.description && (
            <p className="text-small text-gray-muted mb-4 line-clamp-2 flex-1">
              {stack.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-light">
            {/* Owner */}
            <div className="flex items-center gap-2">
              {stack.owner?.avatar_url ? (
                <Image
                  src={stack.owner.avatar_url}
                  alt={displayName}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-jet/20 flex items-center justify-center text-xs font-semibold text-jet">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-small text-gray-muted">{username}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-small text-gray-muted">
              <span className="flex items-center gap-1">
                <span>👍</span>
                {stack.stats.upvotes || 0}
              </span>
              <span className="flex items-center gap-1">
                <span>💾</span>
                {stack.stats.saves || 0}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

