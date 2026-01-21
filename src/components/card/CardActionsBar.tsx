'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVotes } from '@/hooks/useVotes';
import { useSaves } from '@/hooks/useSaves';
import { useToast } from '@/contexts/ToastContext';
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useDiscussion } from "@/contexts/DiscussionContext";

interface CardActionsBarProps {
  cardId: string;
  initialUpvotes: number;
  initialSaves: number;
  shareUrl: string;
  title: string;
  isOwner?: boolean;
}

export function CardActionsBar({ 
  cardId, 
  initialUpvotes, 
  initialSaves, 
  shareUrl,
  title,
  isOwner = false
}: CardActionsBarProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { openDiscussion } = useDiscussion();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { upvotes, voted, isLoading: isVoting, toggleVote } = useVotes({
    targetType: 'card',
    targetId: cardId,
    initialUpvotes,
    initialVoted: false, // Ideally fetch this state, but hooks handle client-side check
  });

  const { saves, saved, isLoading: isSaving, toggleSave } = useSaves({
    cardId: cardId,
    targetType: 'card',
    initialSaves,
    initialSaved: false,
  });

  const { user } = useAuth();

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          url: shareUrl,
        });
      } catch (err) {
        // Ignore abort errors
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showSuccess('Link copied to clipboard!');
      } catch (err) {
        showError('Failed to copy link');
      }
    }
  };

  const handleVote = () => {
    if (!user) {
      showError("Please login to upvote");
      return;
    }
    toggleVote();
  };

  const handleSave = () => {
    if (!user) {
      showError("Please login to save");
      return;
    }
    toggleSave();
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('cards').delete().eq('id', cardId);
      
      if (error) throw error;
      
      showSuccess("Card deleted successfully");
      router.push('/'); 
    } catch (error) {
      console.error(error);
      showError("Failed to delete card");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 py-4 border-b border-gray-100 flex-wrap">
        {/* Upvote Button */}
        <button
          onClick={handleVote}
          disabled={isVoting}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 border ${
            voted 
              ? 'bg-red-50 border-red-200 text-red-500' 
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg 
            className={`w-5 h-5 ${voted ? 'fill-current' : 'none'}`} 
            fill={voted ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-medium">{upvotes}</span>
        </button>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 border ${
            saved 
              ? 'bg-emerald-50 border-emerald-200 text-emerald' 
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg 
            className={`w-5 h-5 ${saved ? 'fill-current' : 'none'}`}
            fill={saved ? 'currentColor' : 'none'}
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span className="font-medium">{saves}</span>
        </button>

        {/* Comment Button (Opens Drawer) */}
        <button
          onClick={() => openDiscussion('card', cardId, title)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
           </svg>
           <span className="font-medium">Discuss</span>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="font-medium">Share</span>
        </button>

        {/* Owner Actions */}
        {isOwner && (
          <>
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>
            
            <button
               onClick={() => setIsDeleteConfirmOpen(true)}
               className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200 ml-auto sm:ml-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="font-medium">Delete</span>
            </button>
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Card"
        message="Are you sure you want to delete this card? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </>
  );
}