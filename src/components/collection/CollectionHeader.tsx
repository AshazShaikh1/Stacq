'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { EditCollectionModal } from '@/components/collection/EditCollectionModal';
import { useVotes } from '@/hooks/useVotes';
import { useSaves } from '@/hooks/useSaves';
import { ReportButton } from '@/components/report/ReportButton';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';

interface CollectionHeaderProps {
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
    tags?: Array<{
      id: string;
      name: string;
    }>;
    is_public?: boolean;
    is_hidden?: boolean;
  };
  isOwner?: boolean;
}

export function CollectionHeader({ collection, isOwner = false }: CollectionHeaderProps) {
  const router = useRouter();
  const { upvotes, voted, isLoading, error, toggleVote } = useVotes({
    targetType: 'collection',
    targetId: collection.id,
    initialUpvotes: collection.stats.upvotes || 0,
    initialVoted: false, // Will be fetched by hook
  });

  const { saves: saveCount, saved: isSaved, isLoading: isSaving, isAnimating, toggleSave } = useSaves({
    collectionId: collection.id,
    initialSaves: collection.stats.saves || 0,
    initialSaved: false, // Will be fetched by hook
  });
  const [user, setUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: collection.title,
        text: collection.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleClone = async () => {
    if (!user) {
      alert('Please sign in to clone collections');
      return;
    }

    if (isOwner) {
      alert('You cannot clone your own collection');
      return;
    }

    try {
      const response = await fetch(`/api/collections/${collection.id}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clone collection');
      }

      // Track analytics
      if (data.collection?.id && user) {
        trackEvent.cloneStack(user.id, collection.id, data.collection.id);
      }

      // Redirect to the cloned collection
      if (data.collection?.id) {
        window.location.href = `/collection/${data.collection.id}`;
      } else {
        alert('Collection cloned successfully!');
        // Refresh the page to show updated state
        window.location.reload();
      }
    } catch (error: any) {
      alert(error.message || 'Failed to clone collection. Please try again.');
    }
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

      // Redirect to home page after deletion
      router.push('/');
    } catch (error: any) {
      alert(error.message || 'Failed to delete collection');
      setIsDeleting(false);
    }
  };

  return (
    <div className="mb-8">
      {/* Cover Image */}
      {collection.cover_image_url ? (
        <div className="relative w-full h-96 rounded-lg overflow-hidden mb-6">
          <Image
            src={collection.cover_image_url}
            alt={collection.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
      ) : (
        <div className="w-full h-64 bg-gradient-to-br from-jet/10 to-gray-light rounded-lg mb-6 flex items-center justify-center">
          <div className="text-6xl">📚</div>
        </div>
      )}

      {/* Title and Description */}
      <div className="mb-6">
        <h1 className="text-h1 font-bold text-jet-dark mb-3">
          {collection.title}
        </h1>
        {collection.description && (
          <p className="text-body text-gray-muted mb-4">
            {collection.description}
          </p>
        )}

        {/* Tags */}
        {collection.tags && collection.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {collection.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/explore?tag=${tag.name}`}
                className="px-3 py-1 bg-gray-light rounded-full text-small text-jet-dark hover:bg-jet hover:text-white transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Owner Info */}
        {collection.owner && (
          <div className="flex items-center gap-3 mb-6">
            {collection.owner.avatar_url ? (
              <Image
                src={collection.owner.avatar_url}
                alt={collection.owner.display_name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-jet/20 flex items-center justify-center text-xs font-semibold text-jet">
                {collection.owner.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <Link
              href={`/profile/${collection.owner.username}`}
              className="text-body text-jet-dark hover:text-jet font-medium"
            >
              {collection.owner.display_name}
            </Link>
            <span className="text-small text-gray-muted">
              @{collection.owner.username}
            </span>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-4 pb-6 border-b border-gray-light">
        <Button
          variant={voted ? 'primary' : 'outline'}
          size="sm"
          onClick={toggleVote}
          disabled={isLoading}
        >
          <span className="mr-2">👍</span>
          {upvotes} {upvotes === 1 ? 'Upvote' : 'Upvotes'}
        </Button>
        {error && (
          <span className="text-small text-red-500 ml-2">{error}</span>
        )}

        {isOwner ? (
          // Owner sees save count only (not clickable)
          <div className="px-4 py-2 rounded-md border border-gray-light text-sm font-medium text-jet-dark">
            <span className="mr-2">💾</span>
            {saveCount} {saveCount === 1 ? 'Save' : 'Saves'}
          </div>
        ) : user ? (
          // Logged-in visitor can save/unsave
          <Button
            variant={isSaved ? 'primary' : 'outline'}
            size="sm"
            onClick={toggleSave}
            disabled={isSaving}
            className={`relative ${isAnimating ? 'animate-pulse scale-110' : ''} transition-all duration-300`}
          >
            <span className={`mr-2 inline-block ${isAnimating ? 'animate-bounce' : ''}`}>💾</span>
            {isSaved ? 'Saved' : 'Save'} {saveCount > 0 && `(${saveCount})`}
          </Button>
        ) : (
          // Not logged in - show save count only
          <div className="px-4 py-2 rounded-md border border-gray-light text-sm font-medium text-jet-dark">
            <span className="mr-2">💾</span>
            {saveCount} {saveCount === 1 ? 'Save' : 'Saves'}
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
        >
          <span className="mr-2">🔗</span>
          Share
        </Button>


        {isOwner ? (
          <Dropdown
            items={[
              {
                label: 'Edit',
                onClick: () => setIsEditModalOpen(true),
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
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClone}
              disabled={!user}
            >
              <span className="mr-2">📋</span>
              Clone
            </Button>
            <ReportButton
              targetType="collection"
              targetId={collection.id}
              variant="outline"
              size="sm"
            />
          </>
        )}

        {/* Stats */}
        <div className="ml-auto flex items-center gap-6 text-small text-gray-muted">
          <span>{collection.stats.views || 0} views</span>
          <span>{collection.stats.comments || 0} comments</span>
        </div>
      </div>

      {/* Edit Modal */}
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
    </div>
  );
}

