'use client';

import { ComponentType, lazy, Suspense } from 'react';
import { CollectionGridSkeleton } from '@/components/ui/Skeleton';

/**
 * Higher-order component for lazy loading with loading fallback
 */
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  Fallback?: ComponentType
) {
  const LazyComponent = lazy(() => Promise.resolve({ default: Component }));
  
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={Fallback ? <Fallback /> : <div>Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

/**
 * Lazy load a component with a default skeleton fallback
 */
export function lazyLoad<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={fallback || <div className="p-4">Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

