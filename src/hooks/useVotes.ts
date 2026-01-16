'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
import { useToast } from '@/contexts/ToastContext';

interface UseVotesOptions {
  targetType: 'collection' | 'card' | 'stack'; // 'stack' for legacy support
  targetId: string;
  initialUpvotes?: number;
  initialVoted?: boolean;
}

export function useVotes({ targetType, targetId, initialUpvotes = 0, initialVoted = false }: UseVotesOptions) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [voted, setVoted] = useState(initialVoted);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError, showInfo } = useToast();

  const fetchVoteCount = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get vote count - support both 'collection' and 'stack' (legacy)
    const voteType = targetType === 'stack' ? 'collection' : targetType;
    const { count, error } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('target_type', voteType)
      .eq('target_id', targetId);

    if (error) {
      console.error('Error fetching vote count:', error);
      // Don't overwrite if there's an error - keep current value
      return;
    }

    setUpvotes(count || 0);

    // Check if user has voted
    if (user) {
      const { data: userVote } = await supabase
        .from('votes')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_type', voteType)
        .eq('target_id', targetId)
        .maybeSingle();

      setVoted(!!userVote);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Only fetch if we don't have an initial value or if the ID changed
    // This prevents overwriting the initial value from the feed API
    if (initialUpvotes === 0 && upvotes === 0) {
      fetchVoteCount();
    } else if (!initialVoted) {
      // Only fetch user's vote status if we don't have initial value
      // Use fetchVoteCount which already handles user check efficiently
      fetchVoteCount();
    }
  }, [targetType, targetId, fetchVoteCount, initialUpvotes, initialVoted, upvotes]);

  const toggleVote = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      showInfo('Please sign in to upvote');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Optimistic Update
    const previousVoted = voted;
    const previousCount = upvotes;
    
    const newVoted = !voted;
    const newCount = voted ? Math.max(0, upvotes - 1) : upvotes + 1;
    
    setVoted(newVoted);
    setUpvotes(newCount);

    try {
      // Call Atomic RPC Function
      const { data, error: rpcError } = await supabase.rpc('toggle_vote', {
        p_target_type: targetType, // RPC handles normalization
        p_target_id: targetId
      });

      if (rpcError) throw rpcError;

      // Sync with server state
      if (data) {
        setVoted(data.voted);
        setUpvotes(data.count);
        
        // Track analytics
        if (data.voted) {
          trackEvent.upvote(user.id, targetType as any, targetId);
        }
      }
    } catch (err: any) {
      console.error("Vote failed:", err);
      // Revert optimistic update
      setVoted(previousVoted);
      setUpvotes(previousCount);
      
      const errorMsg = err.message || 'Failed to vote';
      showError(errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    upvotes,
    voted,
    isLoading,
    error,
    toggleVote,
  };
}

