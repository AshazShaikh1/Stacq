'use client';

import Link from 'next/link';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      {icon && (
        <div className="text-6xl mb-6 flex justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-h2 font-semibold text-jet-dark mb-2">
        {title}
      </h3>
      <p className="text-body text-gray-muted mb-8 max-w-md mx-auto">
        {description}
      </p>
      {(action || secondaryAction) && (action?.onClick || action?.href || secondaryAction?.onClick || secondaryAction?.href) && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            action.href ? (
              <Link href={action.href}>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {action.label}
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                size="sm"
                className="w-full sm:w-auto"
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link href={secondaryAction.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  {secondaryAction.label}
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Predefined empty states for common scenarios
 */
export function EmptyStacksState({ onCreateStack }: { onCreateStack?: () => void }) {
  return (
    <EmptyState
      icon="📌"
      title="No collections yet"
      description="Start by creating your first collection to organize and share your favorite resources"
      action={{
        label: "Create Collection",
        onClick: onCreateStack,
      }}
      secondaryAction={{
        label: "Explore Collections",
        href: "/explore",
      }}
    />
  );
}

export function EmptyCardsState({ onAddCard }: { onAddCard?: () => void }) {
  return (
    <EmptyState
      icon="🔗"
      title={onAddCard ? "No cards yet" : "No cards found"}
      description={onAddCard ? "Add your first card to this collection to get started" : "This collection doesn't have any cards yet"}
      action={{
        label: "Create Card",
        onClick: onAddCard,
      }}
    />
  );
}

export function EmptyCommentsState() {
  return (
    <EmptyState
      icon="💬"
      title="No comments yet"
      description="Be the first to share your thoughts"
    />
  );
}

export function EmptySearchState({ query }: { query: string }) {
  return (
    <EmptyState
      icon="🔍"
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try different keywords or explore trending content.`}
      action={{
        label: "Explore",
        href: "/explore",
      }}
    />
  );
}

export function EmptySavedStacksState() {
  return (
    <EmptyState
      icon="💾"
      title="No saved collections"
      description="Save collections you like to find them easily later"
      action={{
        label: "Explore Collections",
        href: "/explore",
      }}
    />
  );
}

export function EmptySavedCollectionsState() {
  return <EmptySavedStacksState />;
}

export function EmptyCollectionsState({ onCreateStack }: { onCreateStack?: () => void }) {
  return <EmptyStacksState onCreateStack={onCreateStack} />;
}

