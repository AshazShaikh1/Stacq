"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Dropdown } from "@/components/ui/Dropdown";
import { EditCollectionModal } from "@/components/collection/EditCollectionModal";
import { createClient } from "@/lib/supabase/client";
import { useSaves } from "@/hooks/useSaves";
import { useVotes } from "@/hooks/useVotes";
import { useToast } from "@/contexts/ToastContext";

interface CollectionCardProps {
  collection: {
    id: string;
    title: string;
    description?: string;
    cover_image_url?: string;
    first_card_thumbnail_url?: string; // First card's thumbnail as fallback
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
  hideHoverButtons?: boolean;
}

export function CollectionCard({
  collection,
  hideHoverButtons = false,
}: CollectionCardProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Save functionality
  const {
    saved: isSaved,
    toggleSave,
  } = useSaves({
    collectionId: collection.id,
    targetType: "collection",
    initialSaves: collection.stats?.saves || 0,
    initialSaved: false,
  });

  // Vote functionality
  const {
    voted,
    toggleVote,
  } = useVotes({
    targetType: "collection",
    targetId: collection.id,
    initialUpvotes: collection.stats?.upvotes || 0,
    initialVoted: false,
  });

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
    if (
      !confirm(
        `Are you sure you want to delete "${collection.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete collection");
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to delete collection");
      setIsDeleting(false);
    }
  };

  const displayName = collection.owner?.display_name || "Unknown";
  const username = collection.owner?.username || "unknown";

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (navigator.share) {
      navigator
        .share({
          title: collection.title,
          text: collection.description || "",
          url: `${window.location.origin}/collection/${collection.id}`,
        })
        .catch(() => {});
    } else {
      navigator.clipboard
        .writeText(`${window.location.origin}/collection/${collection.id}`)
        .then(() => showSuccess("Link copied to clipboard!"))
        .catch(() => showError("Failed to copy link"));
    }
  };

  // Logic for image source: Cover -> First Card -> Fallback
  const imageUrl = collection.cover_image_url || collection.first_card_thumbnail_url;

  return (
    <>
      <div 
        className="relative h-full group break-inside-avoid"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card
          hover={false}
          className="relative overflow-hidden flex flex-col bg-stone-50 rounded-xl border border-gray-light shadow-sm hover:shadow-md transition-all duration-300"
        >
          {/* Overlay Link */}
          <Link
            href={`/collection/${collection.id}`}
            className="absolute inset-0 z-10"
            aria-label={`View collection ${collection.title}`}
          />

          {/* Image Section */}
          <div className="w-full relative">
             {imageUrl ? (
               /* Natural Height Image */
               <img
                 src={imageUrl}
                 alt={collection.title}
                 className="w-full h-auto object-cover block"
                 loading="lazy"
               />
             ) : (
               /* Fallback with fixed aspect ratio */
               <div className="w-full aspect-[3/2] bg-gradient-to-br from-emerald/5 via-stone-100 to-stone-50 flex items-center justify-center">
                 <div className="text-3xl opacity-20">📚</div>
               </div>
             )}
             
             {/* Inner Shadow Gradient */}
             <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent pointer-events-none" />

             {/* Collection Icon */}
             <div className="absolute top-2 left-2 z-20 pointer-events-none">
                <div className="w-6 h-6 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-md shadow-sm text-emerald">
                   <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                   </svg>
                </div>
             </div>

              {/* Action Buttons */}
              {!hideHoverButtons && (
              <div
                  className="absolute top-2 right-2 z-20 flex items-center gap-1.5 transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  onClick={(e) => e.preventDefault()}
              >
                  <button
                      onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleVote();
                      }}
                      className={`w-7 h-7 rounded-md bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm ${
                          voted ? "text-emerald" : "text-jet-dark"
                      }`}
                  >
                      <svg className={`w-3.5 h-3.5 ${voted ? "fill-current" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                  </button>

                  <button
                  onClick={handleShare}
                  className="w-7 h-7 rounded-md bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm text-jet-dark"
                  >
                  <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                  >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  </button>

                  {isOwner && (
                  <div className="relative">
                      <Dropdown
                      items={[
                          {
                          label: "Edit",
                          onClick: handleEdit,
                          icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                          ),
                          },
                          {
                          label: "Delete",
                          onClick: handleDelete,
                          variant: "danger",
                          icon: (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                          ),
                          },
                      ]}
                      className="w-7 h-7"
                      >
                      <div className="w-7 h-7 rounded-md bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm pointer-events-none">
                          <svg className="w-3.5 h-3.5 text-jet-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                      </div>
                      </Dropdown>
                  </div>
                  )}
              </div>
              )}
          </div>

          {/* Compact Content Section */}
          <div className="p-3 flex-1 flex flex-col relative bg-stone-50">
            <h3 className="text-sm font-bold text-jet-dark leading-snug group-hover:text-emerald transition-colors line-clamp-2 mb-1">
               {collection.title}
            </h3>

            {collection.description && (
              <p className="text-xs text-gray-muted line-clamp-2 mb-3 leading-relaxed">
                {collection.description}
              </p>
            )}

            <div className="mt-auto flex items-center justify-between text-[11px] text-gray-muted">
               <div className="flex items-center gap-1.5 z-20" onClick={(e) => e.stopPropagation()}>
                 <Link href={`/profile/${username}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    {collection.owner?.avatar_url ? (
                    <Image
                        src={collection.owner.avatar_url}
                        alt={displayName}
                        width={16}
                        height={16}
                        className="rounded-full ring-1 ring-white"
                    />
                    ) : (
                    <div className="w-4 h-4 rounded-full bg-stone-200 flex items-center justify-center text-[9px] font-bold text-gray-500 border border-white">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    )}
                    <span className="font-medium text-gray-500 group-hover:text-jet-dark transition-colors truncate max-w-[100px]">
                      {displayName}
                    </span>
                 </Link>
               </div>
               
               <div className="flex items-center gap-2.5 opacity-70">
                 {/* Count Pill */}
                 <div className="flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>{collection.stats.saves > 0 ? collection.stats.saves + 1 : 1}</span>
                 </div>
               </div>
            </div>
          </div>
        </Card>
      </div>

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
