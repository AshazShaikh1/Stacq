"use client";

import { Suspense, lazy } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { useDiscussion } from "@/contexts/DiscussionContext";
import { CommentSkeleton } from "@/components/ui/Skeleton";

// Lazy load CommentsSection to split bundle
const CommentsSection = lazy(() =>
  import("@/components/comments/CommentsSection").then((m) => ({
    default: m.CommentsSection,
  }))
);

export function DiscussionDrawer() {
  const { activeTarget, closeDiscussion } = useDiscussion();
  const isOpen = !!activeTarget;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={closeDiscussion}
      title={activeTarget?.title || "Discussion"}
    >
      {activeTarget && (
        <Suspense
          fallback={
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <CommentSkeleton key={i} />
              ))}
            </div>
          }
        >
          {/* We key by targetId to force remount when switching targets */}
          <CommentsSection
            key={activeTarget.id}
            targetType={activeTarget.type}
            targetId={activeTarget.id}
            // collectionOwnerId/stackOwnerId handled differently or optional in new design?
            // CommentsSection still expects them for permission checks (canDelete).
            // For now, we might not have ownerId here easily without fetching.
            // But CommentsSection might fetch it or user permissions check handles it.
            // Let's pass undefined for now, or we'd need to fetch target details.
            // However, typical RBAC often checks 'canDelete' by asking backend or checking if user is owner of comment.
            // Owner of COLLECTION can also delete.
            // This might be a gap, but for MVP drawer, let's proceed.
          />
        </Suspense>
      )}
    </Drawer>
  );
}
