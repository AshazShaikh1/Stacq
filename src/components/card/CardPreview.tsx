"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Dropdown } from "@/components/ui/Dropdown";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EditCardModal } from "@/components/card/EditCardModal";
import { createClient } from "@/lib/supabase/client";
import { useSaves } from "@/hooks/useSaves";
import { useVotes } from "@/hooks/useVotes";
import { generatePlaceholderImage } from "@/lib/utils/placeholder";
import { useToast } from "@/contexts/ToastContext";

interface CardPreviewProps {
  card: {
    id: string;
    title?: string;
    description?: string;
    thumbnail_url?: string;
    canonical_url: string;
    domain?: string;
    metadata?: {
      saves?: number;
      upvotes?: number;
      affiliate_url?: string;
      is_amazon_product?: boolean;
    };
    created_by?: string;
    owner_id?: string; // Add alias for robustness
    creator?: {
      username?: string;
      display_name?: string;
    };
  };
  stackId?: string;
  stackOwnerId?: string;
  collectionId?: string;
  collectionOwnerId?: string;
  addedBy?: string;
  note?: string | null;
  hideHoverButtons?: boolean;
}

export function CardPreview({
  card,
  stackId,
  stackOwnerId,
  collectionId,
  collectionOwnerId,
  addedBy,
  note,
  hideHoverButtons = false,
}: CardPreviewProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  // Determine Card Type
  const getCardType = () => {
    const url = card.canonical_url?.toLowerCase() || "";
    const isImage = !!url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/);
    const isDoc = !!url.match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt)$/);
    
    if (isImage) return "image";
    if (isDoc) return "document";
    return "link";
  };

  const cardType = getCardType();
  const isDoc = cardType === "document";
  const isImage = cardType === "image";
  const isLink = cardType === "link";

  const displayTitle = card.title || card.canonical_url;
  const displayDomain =
    card.domain ||
    (card.canonical_url ? new URL(card.canonical_url).hostname : "");

  const getImageHeight = (id: string): number => {
    if (isLink || isDoc) return 180;
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    const variation = Math.abs(hash) % 5;
    const heights = [200, 240, 280, 320, 360];
    return heights[variation];
  };

  const imageHeight = getImageHeight(card.id);

  const placeholderUrl = useMemo(
    () =>
      generatePlaceholderImage(
        imageHeight * 1.33,
        imageHeight,
        displayTitle.substring(0, 15) || "Card"
      ),
    [imageHeight, displayTitle]
  );

  useEffect(() => {
    setImageUrl(card.thumbnail_url || placeholderUrl);
  }, [card.thumbnail_url, placeholderUrl]);

  const {
    saves: saveCount,
    saved: isSaved,
    isLoading: isSaving,
    isAnimating,
    toggleSave,
  } = useSaves({
    cardId: card.id,
    targetType: "card",
    initialSaves: card.metadata?.saves || 0,
    initialSaved: false,
  });

  const {
    upvotes,
    voted,
    isLoading: isVoting,
    toggleVote,
  } = useVotes({
    targetType: "card",
    targetId: card.id,
    initialUpvotes: card.metadata?.upvotes || 0,
    initialVoted: false,
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const ownerId = collectionOwnerId || stackOwnerId;
  const id = collectionId || stackId;
  const cardCreatorId = card.created_by || card.owner_id;

  const isCollectionOwner = user && id && (user.id === ownerId || user.id === addedBy);
  const isCardCreator = user && cardCreatorId && user.id === cardCreatorId;

  const canEdit = isCollectionOwner || isCardCreator;

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const [isDeleted, setIsDeleted] = useState(false);

  // ... (existing code)

  const handleDelete = async () => {
    // Optimistic Update: Hide card immediately
    setIsDeleteConfirmOpen(false);
    setIsDeleted(true);
    
    // We already hid it, so no need for spinner state unless we want to keep it in background
    setIsDeleting(true); 

    try {
      let url = `/api/cards/${card.id}`;
      if (id) {
        const queryParam = collectionId
          ? `collection_id=${collectionId}`
          : stackId
          ? `stack_id=${stackId}`
          : "";
        if (queryParam) {
          url += `?${queryParam}`;
        }
      }

      const response = await fetch(url, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete card");
      }

      showSuccess(
        id
          ? "Card removed from collection"
          : "Card deleted"
      );
      
      // Sync server state in background
      router.refresh();
    } catch (error: any) {
      console.error("Error deleting card:", error);
      // Rollback optimistic update
      setIsDeleted(false);
      showError(error.message || "Failed to delete card");
    } finally {
        setIsDeleting(false);
    }
  };

  const externalUrl =
    card.metadata?.affiliate_url || card.canonical_url;

  if (isDeleted) {
    return null;
  }

  return (
    <>
      <div
        className="relative group" // Removed h-full
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card
          hover={false}
          className={`
            relative overflow-hidden flex flex-col bg-white rounded-lg transition-all duration-200
            ${isImage ? "border-none shadow-sm hover:shadow-md" : ""} 
            ${isLink ? "border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-300" : ""}
            ${isDoc ? "border border-gray-200 bg-gray-50/50 shadow-sm hover:shadow-md" : ""}
          `}
        >
          {/* ================= CURATOR NOTE ================= */}
          {note && (
            <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex gap-3 text-sm text-amber-900 leading-snug">
               <span className="text-xl shrink-0">📝</span>
               <div className="font-medium text-amber-950/90">{note}</div>
            </div>
          )}

          {/* Overlay Link: Go to Card Details */}
          <Link
            href={`/card/${card.id}`}
            className="absolute inset-0 z-10"
            aria-label={`View details for ${displayTitle}`}
          />

          {/* ================= IMAGE CARD DESIGN ================= */}
          {isImage && (
            <div className="relative w-full flex flex-col">
               {/* Full-bleed Image with Dynamic Height */}
               <div 
                 className="relative w-full bg-gray-100"
                 style={{ height: `${imageHeight}px` }}
               >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={displayTitle || "Card"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      unoptimized={imageUrl.startsWith("data:")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🖼️</div>
                  )}
                  {/* Subtle Gradient Overlay for Text Readability */}
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
               </div>

               {/* Minimal Chrome Overlay */}
               <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none">
                  <h3 className="text-white text-sm font-medium drop-shadow-md line-clamp-2 leading-snug">
                     {displayTitle}
                  </h3>
               </div>
               
               {/* Type Icon (Top Left) - Subtle */}
               <div className="absolute top-2 left-2 z-20">
                  <div className="p-1.5 bg-black/20 backdrop-blur-md rounded text-white/90">
                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                  </div>
               </div>
            </div>
          )}

          {/* ================= DOCUMENT CARD DESIGN ================= */}
          {isDoc && (
             <div className="relative w-full h-full min-h-[180px] p-4 flex flex-col bg-white">
                {/* Header (Icon + Type) */}
                <div className="flex items-start justify-between mb-3">
                   <div className="flex items-center gap-2">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-500 rounded-lg">
                         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                      </div>
                      <div className="flex flex-col">
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Document</span>
                         {/* Extension Badge if possible to parse */}
                         <span className="text-xs font-semibold text-gray-700">PDF</span> 
                      </div>
                   </div>
                </div>

                {/* Title & Info */}
                <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-3 mb-auto">
                   {displayTitle}
                </h3>
                
                {/* Footer Metadata */}
                <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                   <span>{displayDomain}</span>
                   {/* Maybe file size if available, simplified for now */}
                   <span>View</span>
                </div>
             </div>
          )}

          {/* ================= LINK CARD DESIGN (Bookmark) ================= */}
          {isLink && (
             <div className="relative w-full h-full min-h-[160px] flex flex-col p-4 bg-white">
                {/* Domain / Favicon Header */}
                <div className="flex items-center gap-2 mb-3 opacity-70">
                   {/* Placeholder Favicon based on domain */}
                   <div className="w-4 h-4 rounded-full bg-gray-200 flex-shrink-0 relative overflow-hidden">
                       <Image 
                          src={`https://www.google.com/s2/favicons?domain=${displayDomain}&sz=32`}
                          alt="icon"
                          fill
                          className="object-cover"
                          unoptimized
                       />
                   </div>
                   <span className="text-xs font-medium text-gray-500 truncate">{displayDomain}</span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-gray-900 leading-snug line-clamp-3 mb-2 group-hover:text-emerald transition-colors">
                   {displayTitle}
                </h3>

                {/* Description (Optional, clamped) */}
                {card.description && (
                   <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-auto">
                      {card.description}
                   </p>
                )}
                
                {/* Link Arrow visual - Now a real external link */}
                <div className="mt-3 flex justify-end relative z-20">
                   <a 
                     href={externalUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     onClick={(e) => e.stopPropagation()}
                     className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                     title="Visit Source"
                   >
                     <svg className="w-4 h-4 text-gray-300 group-hover:text-emerald transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                     </svg>
                   </a>
                </div>
             </div>
          )}

          {/* ================= COMMON HOVER ACTIONS (All Types) ================= */}
          {/* Only showing subtle hover buttons, not blocking content */}
          {!hideHoverButtons && (
             <div className="absolute top-2 right-2 z-40 flex items-center gap-1 transition-opacity duration-200 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                 {/* Vote */}
                 <button
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     if (!user) {
                       showError("Please login to upvote");
                       return;
                     }
                     toggleVote();
                   }}
                   className={`p-1.5 rounded bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-colors ${
                     voted ? "text-emerald" : "text-gray-500"
                   }`}
                   title="Upvote"
                 >
                    <svg className={`w-3.5 h-3.5 ${voted ? "fill-current" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                 </button>

                 {/* Save */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user) {
                        showError("Please login to save");
                        return;
                      }
                      toggleSave();
                    }}
                    className={`p-1.5 rounded bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-colors ${
                      isSaved ? "text-emerald" : "text-gray-500"
                    }`}
                    title="Save"
                  >
                     <svg className={`w-3.5 h-3.5 ${isSaved ? "fill-current" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                     </svg>
                  </button>

                 {/* Options */}
                 {canEdit && (
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      items={[
                        {
                          label: "Edit",
                          onClick: handleEdit,
                          icon: (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          ),
                        },
                        {
                          label: "Delete",
                          onClick: handleDeleteClick,
                          variant: "danger",
                          icon: (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          ),
                        },
                      ]}
                      className="w-7 h-7"
                    >
                      <div className="p-1.5 rounded bg-white/90 backdrop-blur shadow-sm hover:bg-white transition-colors text-gray-500 cursor-pointer">
                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </div>
                    </Dropdown>
                  </div>
                 )}
             </div>
          )}
        </Card>
      </div>

      {isEditModalOpen && (
        <EditCardModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          card={{
            id: card.id,
            title: card.title,
            description: card.description,
            thumbnail_url: card.thumbnail_url,
            canonical_url: card.canonical_url,
          }}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={id ? "Remove Card from Collection" : "Delete Card"}
        message={
          id
            ? "Are you sure you want to remove this card from the collection? This action cannot be undone."
            : "Are you sure you want to delete this card permanently? This action cannot be undone."
        }
        confirmText={id ? "Remove" : "Delete"}
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}
