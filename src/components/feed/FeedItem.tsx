'use client';

import { CollectionCard } from '@/components/collection/CollectionCard';
import { CardPreview } from '@/components/card/CardPreview';

interface Attribution {
  id: string;
  user_id: string;
  source: string;
  collection_id?: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  // Legacy support
  stack_id?: string;
}

interface FeedItemProps {
  item: {
    type: 'card' | 'collection';
    id: string;
    title?: string;
    description?: string;
    thumbnail_url?: string;
    canonical_url?: string;
    domain?: string;
    cover_image_url?: string;
    slug?: string;
    is_public?: boolean;
    stats?: any;
    owner_id?: string;
    created_at?: string;
    owner?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
    };
    creator?: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
    };
    attributions?: Attribution[];
  };
  hideHoverButtons?: boolean;
}

export function FeedItem({ item, hideHoverButtons = false }: FeedItemProps) {
  if (item.type === 'collection') {
    return <CollectionCard collection={item as any} hideHoverButtons={hideHoverButtons} />;
  }

  // Card item - use the new Pinterest-style CardPreview component
  const card = item;
  
  // Extract metadata for saves/upvotes from feed API response
  // Feed API returns saves_count and upvotes_count directly on the card object
  const metadata = {
    saves: (card as any).saves_count || (card as any).metadata?.saves || 0,
    upvotes: (card as any).upvotes_count || (card as any).metadata?.upvotes || 0,
  };

  return (
    <CardPreview
      card={{
        id: card.id,
        title: card.title,
        description: card.description,
        thumbnail_url: card.thumbnail_url,
        canonical_url: card.canonical_url || '#',
        domain: card.domain,
        metadata,
        created_by: (card as any).created_by, // Pass created_by for edit permissions
      }}
      hideHoverButtons={hideHoverButtons}
    />
  );
}

