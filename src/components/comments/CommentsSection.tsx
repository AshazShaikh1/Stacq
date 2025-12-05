'use client';

import { useComments } from '@/hooks/useComments';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { CommentSkeleton } from '@/components/ui/Skeleton';
import { EmptyCommentsState } from '@/components/ui/EmptyState';

interface CommentsSectionProps {
  targetType: 'collection' | 'card' | 'stack'; // 'stack' for legacy support
  targetId: string;
  stackOwnerId?: string; // Legacy support
  collectionOwnerId?: string;
}

export function CommentsSection({ targetType, targetId, stackOwnerId, collectionOwnerId }: CommentsSectionProps) {
  // Convert 'stack' to 'collection' for the hook
  const apiTargetType = targetType === 'stack' ? 'collection' : targetType;
  const { comments, isLoading, error, addComment, refreshComments } = useComments({
    targetType: apiTargetType,
    targetId,
  });

  if (isLoading) {
    return (
      <div className="py-8">
        <h2 className="text-h2 font-bold text-jet-dark mb-6">Comments</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <CommentSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="text-center text-red-500 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="font-medium">Error loading comments</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h2 className="text-h2 font-bold text-jet-dark mb-6">
        Comments ({comments.length})
      </h2>

      <CommentForm onSubmit={addComment} />

      <div className="mt-8 space-y-6">
        {comments.length === 0 ? (
          <EmptyCommentsState />
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              targetType={apiTargetType}
              targetId={targetId}
              depth={0}
              stackOwnerId={stackOwnerId}
              collectionOwnerId={collectionOwnerId}
              onCommentUpdate={refreshComments}
            />
          ))
        )}
      </div>
    </div>
  );
}

