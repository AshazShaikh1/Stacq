'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import { EditCollectionModal } from '@/components/collection/EditCollectionModal';
import { createClient } from '@/lib/supabase/client';

interface CollectionCardProps {
  collection: {
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
    is_public?: boolean;
    is_hidden?: boolean;
    tags?: Array<{ id: string; name: string }>;
  };
}

export function CollectionCard({ collection }: CollectionCardProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const isOwner = user?.id === collection.owner_id;

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {

    if (!confirm(`Are you sure you want to delete "${collection.title}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete collection');
      }

      // Refresh the page to update the grid
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Failed to delete collection');
      setIsDeleting(false);
    }
  };

  const displayName = collection.owner?.display_name || 'Unknown';
  const username = collection.owner?.username || 'unknown';

  return (
    <>
      <Link href={`/collection/${collection.id}`}>
        <Card hover className="overflow-hidden h-full flex flex-col relative">
          {/* Dropdown Menu - Only show for owner */}
          {isOwner && (
            <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
              <Dropdown
                items={[
                  {
                    label: 'Edit',
                    onClick: handleEdit,
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Delete',
                    onClick: handleDelete,
                    variant: 'danger',
                    icon: (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    ),
                  },
                ]}
              />
            </div>
          )}

          {/* Cover Image */}
          {collection.cover_image_url ? (
            <div className="relative w-full h-48 bg-gray-light">
              <Image
                src={collection.cover_image_url}
                alt={collection.title}
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
              {collection.title}
            </h3>

            {/* Description */}
            {collection.description && (
              <p className="text-small text-gray-muted mb-4 line-clamp-2 flex-1">
                {collection.description}
              </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-light">
              {/* Owner */}
              <div className="flex items-center gap-2">
                {collection.owner?.avatar_url ? (
                  <Image
                    src={collection.owner.avatar_url}
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
                  {collection.stats.upvotes || 0}
                </span>
                <span className="flex items-center gap-1">
                  <span>💾</span>
                  {collection.stats.saves || 0}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </Link>

      {isEditModalOpen && (
        <EditCollectionModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          collection={{
            id: collection.id,
            title: collection.title,
            description: collection.description,
            cover_image_url: collection.cover_image_url,
            is_public: collection.is_public ?? true,
            is_hidden: collection.is_hidden ?? false,
            tags: collection.tags || [],
          }}
        />
      )}
    </>
  );
}

