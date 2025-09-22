import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyComponentProps {
  factory: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  className?: string;
  props?: Record<string, any>;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  factory,
  fallback,
  className,
  props = {}
}) => {
  const Component = lazy(factory);
  
  const defaultFallback = (
    <div className={className}>
      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component {...props} />
    </Suspense>
  );
};

/**
 * Higher-order component for lazy loading
 */
export const withLazyLoading = <P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) => {
  return (props: P) => (
    <LazyComponent
      factory={factory}
      fallback={fallback}
      props={props}
    />
  );
};
