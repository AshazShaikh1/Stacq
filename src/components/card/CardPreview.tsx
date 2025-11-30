'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

interface CardPreviewProps {
  card: {
    id: string;
    title?: string;
    description?: string;
    thumbnail_url?: string;
    canonical_url: string;
    domain?: string;
  };
}

export function CardPreview({ card }: CardPreviewProps) {
  const displayTitle = card.title || card.canonical_url;
  const displayDomain = card.domain || new URL(card.canonical_url).hostname;

  return (
    <Link href={card.canonical_url} target="_blank" rel="noopener noreferrer">
      <Card hover className="overflow-hidden h-full flex flex-col">
        {/* Thumbnail */}
        {card.thumbnail_url ? (
          <div className="relative w-full h-48 bg-gray-light">
            <Image
              src={card.thumbnail_url}
              alt={displayTitle || 'Card'}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-jet/10 to-gray-light flex items-center justify-center">
            <div className="text-4xl">🔗</div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title */}
          {card.title && (
            <h3 className="text-h2 font-semibold text-jet-dark mb-2 line-clamp-2">
              {card.title}
            </h3>
          )}

          {/* Description */}
          {card.description && (
            <p className="text-small text-gray-muted mb-3 line-clamp-2 flex-1">
              {card.description}
            </p>
          )}

          {/* Domain */}
          <div className="mt-auto pt-3 border-t border-gray-light">
            <span className="text-small text-gray-muted">{displayDomain}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

