'use client';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyles = 'bg-gray-light';
  
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };
  
  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Can be enhanced with custom wave animation
    none: '',
  };
  
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  
  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={style}
      aria-label="Loading..."
    />
  );
}

/**
 * Collection Card Skeleton (alias for StackCardSkeleton for backward compatibility)
 */
export function CollectionCardSkeleton() {
  return <StackCardSkeleton />;
}

/**
 * Stack Card Skeleton
 */
export function StackCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-light overflow-hidden">
      <Skeleton variant="rectangular" height={200} className="w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" height={20} width="75%" />
        <Skeleton variant="text" height={16} width="50%" />
        <div className="flex items-center gap-2 mt-4">
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" height={16} width={100} />
        </div>
      </div>
    </div>
  );
}

/**
 * Card Preview Skeleton
 */
export function CardPreviewSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-light p-4">
      <div className="flex gap-4">
        <Skeleton variant="rectangular" width={120} height={80} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" height={20} width="80%" />
          <Skeleton variant="text" height={16} width="60%" />
          <Skeleton variant="text" height={14} width="40%" />
        </div>
      </div>
    </div>
  );
}

/**
 * Comment Skeleton
 */
export function CommentSkeleton() {
  return (
    <div className="py-4 border-b border-gray-light last:border-0">
      <div className="flex gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton variant="text" height={16} width={100} />
            <Skeleton variant="text" height={14} width={80} />
          </div>
          <Skeleton variant="text" height={16} width="90%" />
          <Skeleton variant="text" height={16} width="70%" />
        </div>
      </div>
    </div>
  );
}

/**
 * Profile Header Skeleton
 */
export function ProfileHeaderSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-light p-6">
      <div className="flex flex-col sm:flex-row gap-6">
        <Skeleton variant="circular" width={120} height={120} className="mx-auto sm:mx-0" />
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Skeleton variant="text" height={28} width="60%" className="mx-auto sm:mx-0" />
            <Skeleton variant="text" height={20} width="40%" className="mx-auto sm:mx-0" />
          </div>
          <div className="flex gap-4 justify-center sm:justify-start">
            <Skeleton variant="text" height={16} width={80} />
            <Skeleton variant="text" height={16} width={80} />
            <Skeleton variant="text" height={16} width={80} />
          </div>
          <div className="flex gap-2 justify-center sm:justify-start">
            <Skeleton variant="rectangular" width={120} height={36} />
            <Skeleton variant="rectangular" width={120} height={36} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of Collection Skeletons
 */
export function CollectionGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <CollectionCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Grid of Stack Skeletons (legacy, use CollectionGridSkeleton)
 */
export function StackGridSkeleton({ count = 12 }: { count?: number }) {
  return <CollectionGridSkeleton count={count} />;
}

