"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useSaves } from "@/hooks/useSaves";
import { useVotes } from "@/hooks/useVotes";
import { EditCollectionModal } from "./EditCollectionModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import { ReportButton } from "@/components/report/ReportButton";
import { trackEvent } from "@/lib/analytics";

interface CollectionHeaderProps {
  collection: {
    id: string;
    title: string;
    description?: string;
    cover_image_url?: string;
    owner_id: string;
    is_public?: boolean;
    is_hidden?: boolean;
    stats?: {
      views?: number;
      upvotes?: number;
      saves?: number;
      comments?: number;
      cards_count?: number;
      followers?: number;
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
  };
  isOwner?: boolean;
}

export function CollectionHeader({
  collection,
  isOwner = false,
}: CollectionHeaderProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = collection.stats || {
    views: 0,
    upvotes: 0,
    saves: 0,
    comments: 0,
    cards_count: 0,
    followers: 0,
  };

  const {
    saves: saveCount,
    saved: isSaved,
    toggleSave,
    isLoading: isSaveLoading,
    isAnimating,
  } = useSaves({
    targetType: "collection",
    targetId: collection.id,
    initialSaves: stats.saves,
    initialSaved: false,
  } as any);

  const {
    upvotes,
    voted,
    toggleVote,
    isLoading: isVoteLoading,
    error: voteError,
  } = useVotes({
    targetType: "collection",
    targetId: collection.id,
    initialUpvotes: stats.upvotes,
    initialVoted: false,
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");
      showSuccess("Deleted successfully");
      router.push("/");
    } catch (error) {
      showError("Failed to delete collection");
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: collection.title,
          text: collection.description,
          url,
        });
      } catch (err) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showSuccess("Link copied!");
      } catch (err) {
        showError("Failed to copy");
      }
    }
  };

  const handleClone = async () => {
    if (!user) return showError("Please sign in to clone");
    if (isOwner) return showError("Cannot clone your own collection");

    try {
      const response = await fetch(`/api/collections/${collection.id}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (data.collection?.id) {
        trackEvent.cloneStack(user.id, collection.id, data.collection.id);
        showSuccess("Cloned successfully!");
        window.location.href = `/collection/${data.collection.id}`;
      }
    } catch (error: any) {
      showError(error.message);
    }
  };

  return (
    <div className="mb-8">
      {/* Top Section: Cover & Info (Responsive) */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Cover Image */}
        <div className="w-full md:w-64 md:h-48 aspect-video md:aspect-auto relative rounded-xl overflow-hidden shadow-sm bg-gray-100 flex-shrink-0">
          {collection.cover_image_url ? (
            <Image
              src={collection.cover_image_url}
              alt={collection.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 300px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 text-5xl">
              📚
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-bold text-jet-dark mb-3 leading-tight">
              {collection.title}
            </h1>

            {/* Owner & Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
              {collection.owner && (
                <Link
                  href={`/profile/${collection.owner.username}`}
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden relative border border-gray-100">
                    {collection.owner.avatar_url ? (
                      <Image
                        src={collection.owner.avatar_url}
                        alt={collection.owner.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-600 text-white text-[8px] font-bold">
                        {collection.owner.display_name?.[0]}
                      </div>
                    )}
                  </div>
                  <span className="font-medium">
                    {collection.owner.display_name}
                  </span>
                </Link>
              )}

              {/* Tags */}
              {collection.tags?.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/explore?tag=${tag.name}`}
                  className="px-2.5 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>

            {collection.description && (
              <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-3xl mb-6">
                {collection.description}
              </p>
            )}

            {/* Actions Row (Responsive) */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              <Button
                variant={voted ? "primary" : "outline"}
                size="sm"
                onClick={toggleVote}
                disabled={isVoteLoading}
                className={voted ? "bg-emerald-600 border-emerald-600" : ""}
              >
                <span className="mr-1.5">👍</span> {upvotes}
              </Button>

              {isOwner ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="text-red-600 hover:border-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant={isSaved ? "primary" : "outline"}
                    size="sm"
                    onClick={toggleSave}
                    disabled={isSaveLoading}
                    className={`${
                      isSaved ? "bg-emerald-600 border-emerald-600" : ""
                    } ${isAnimating ? "scale-105" : ""} transition-transform`}
                  >
                    <span className="mr-1.5">💾</span>{" "}
                    {isSaved ? "Saved" : "Save"} ({saveCount})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClone}
                    disabled={!user}
                  >
                    Clone
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    Share
                  </Button>
                  <ReportButton
                    targetType="stack"
                    targetId={collection.id}
                    variant="outline"
                    size="sm"
                  />
                </>
              )}
            </div>
            {voteError && (
              <p className="text-xs text-red-500 mt-2">{voteError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar - Scrollable on Mobile */}
      <div className="border-t border-b border-gray-100 py-3 md:py-4">
        <div className="flex md:gap-12 justify-around md:justify-start overflow-x-auto no-scrollbar">
          <div className="flex flex-col items-center md:items-start min-w-[60px]">
            <span className="text-lg md:text-xl font-bold text-jet-dark">
              {stats.cards_count || 0}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">
              Cards
            </span>
          </div>
          <div className="flex flex-col items-center md:items-start min-w-[60px]">
            <span className="text-lg md:text-xl font-bold text-jet-dark">
              {stats.views || 0}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">
              Views
            </span>
          </div>
          <div className="flex flex-col items-center md:items-start min-w-[60px]">
            <span className="text-lg md:text-xl font-bold text-jet-dark">
              {stats.comments || 0}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">
              Comments
            </span>
          </div>
          <div className="flex flex-col items-center md:items-start min-w-[60px]">
            <span className="text-lg md:text-xl font-bold text-jet-dark">
              {saveCount}
            </span>
            <span className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wide">
              Saves
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isOwner && (
        <>
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
          <ConfirmModal
            isOpen={isDeleteConfirmOpen}
            onClose={() => setIsDeleteConfirmOpen(false)}
            onConfirm={handleDelete}
            title="Delete Collection"
            message="Are you sure? This cannot be undone."
            confirmText="Delete"
            variant="danger"
          />
        </>
      )}
    </div>
  );
}
