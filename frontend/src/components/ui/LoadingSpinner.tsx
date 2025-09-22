/**
 * Loading Spinner Component
 * 
 * Installation Location: emirati-journey-platform/src/components/ui/LoadingSpinner.tsx
 * 
 * A reusable loading spinner component with different sizes and styles.
 * Includes accessibility features and customization options.
 */

import React from 'react';
import { Loader2, BarChart3, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

// ============================================================================
// INTERFACES
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'analytics' | 'primary' | 'secondary';
  text?: string;
  showText?: boolean;
  className?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

// ============================================================================
// VARIANT CONFIGURATIONS
// ============================================================================

const variantClasses = {
  default: 'text-gray-600',
  analytics: 'text-blue-600',
  primary: 'text-blue-600',
  secondary: 'text-gray-500'
};

const variantBackgrounds = {
  default: 'bg-white',
  analytics: 'bg-blue-50',
  primary: 'bg-blue-50',
  secondary: 'bg-gray-50'
};

// ============================================================================
// LOADING SPINNER COMPONENT
// ============================================================================

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  text,
  showText = true,
  className,
  fullScreen = false,
  overlay = false
}) => {
  // Default text based on variant
  const defaultText = {
    default: 'Loading...',
    analytics: 'Loading analytics...',
    primary: 'Loading...',
    secondary: 'Loading...'
  };

  const displayText = text || defaultText[variant];

  // Icon selection based on variant
  const IconComponent = variant === 'analytics' ? BarChart3 : Loader2;

  // Base spinner element
  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        <IconComponent 
          className={clsx(
            sizeClasses[size],
            variantClasses[variant],
            'animate-spin'
          )}
          aria-hidden="true"
        />
        
        {/* Additional analytics-specific animation */}
        {variant === 'analytics' && (
          <TrendingUp 
            className={clsx(
              'absolute inset-0',
              sizeClasses[size],
              'text-blue-400 animate-pulse'
            )}
            style={{ animationDelay: '0.5s' }}
            aria-hidden="true"
          />
        )}
      </div>
      
      {showText && (
        <div className={clsx(
          textSizeClasses[size],
          variantClasses[variant],
          'font-medium animate-pulse'
        )}>
          {displayText}
        </div>
      )}
    </div>
  );

  // Full screen loading
  if (fullScreen) {
    return (
      <div 
        className={clsx(
          'fixed inset-0 z-50 flex items-center justify-center',
          overlay ? 'bg-black bg-opacity-50' : variantBackgrounds[variant],
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={displayText}
      >
        {spinner}
      </div>
    );
  }

  // Regular loading spinner
  return (
    <div 
      className={clsx(
        'flex items-center justify-center p-4',
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={displayText}
    >
      {spinner}
    </div>
  );
};

// ============================================================================
// SPECIALIZED LOADING COMPONENTS
// ============================================================================

/**
 * Analytics-specific loading spinner
 */
export const AnalyticsLoadingSpinner: React.FC<Omit<LoadingSpinnerProps, 'variant'>> = (props) => (
  <LoadingSpinner {...props} variant="analytics" />
);

/**
 * Full screen loading overlay
 */
export const FullScreenLoader: React.FC<Omit<LoadingSpinnerProps, 'fullScreen'>> = (props) => (
  <LoadingSpinner {...props} fullScreen overlay />
);

/**
 * Inline loading spinner (small, no text)
 */
export const InlineLoader: React.FC<Omit<LoadingSpinnerProps, 'size' | 'showText'>> = (props) => (
  <LoadingSpinner {...props} size="sm" showText={false} />
);

// ============================================================================
// LOADING SKELETON COMPONENTS
// ============================================================================

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  width = '100%',
  height = '1rem',
  rounded = false
}) => (
  <div
    className={clsx(
      'animate-pulse bg-gray-200',
      rounded ? 'rounded-full' : 'rounded',
      className
    )}
    style={{ width, height }}
    aria-hidden="true"
  />
);

/**
 * Analytics card skeleton
 */
export const AnalyticsCardSkeleton: React.FC = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border">
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width="40%" height="1.25rem" />
        <Skeleton width="2rem" height="2rem" rounded />
      </div>
      
      {/* Main metric */}
      <Skeleton width="60%" height="2rem" />
      
      {/* Chart area */}
      <div className="space-y-2">
        <Skeleton width="100%" height="8rem" />
      </div>
      
      {/* Footer */}
      <div className="flex justify-between">
        <Skeleton width="30%" height="0.875rem" />
        <Skeleton width="25%" height="0.875rem" />
      </div>
    </div>
  </div>
);

/**
 * Dashboard skeleton
 */
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <Skeleton width="200px" height="2rem" />
      <div className="flex space-x-2">
        <Skeleton width="100px" height="2.5rem" />
        <Skeleton width="100px" height="2.5rem" />
      </div>
    </div>
    
    {/* Metrics grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="space-y-2">
            <Skeleton width="70%" height="1rem" />
            <Skeleton width="50%" height="1.5rem" />
            <Skeleton width="40%" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AnalyticsCardSkeleton />
      <AnalyticsCardSkeleton />
    </div>
  </div>
);

/**
 * Table skeleton
 */
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => (
  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
    {/* Header */}
    <div className="border-b bg-gray-50 p-4">
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} width="80%" height="1rem" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} width="90%" height="1rem" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================================================
// LOADING STATES HOOK
// ============================================================================

export const useLoadingStates = () => {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});

  const setLoading = React.useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const isLoading = React.useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = React.useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export default LoadingSpinner;

