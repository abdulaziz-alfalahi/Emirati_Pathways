/**
 * @fileoverview Error Handling Components
 * 
 * A collection of error handling components for different scenarios:
 * - Page-level error boundaries
 * - Section-level error boundaries
 * - API error displays
 * - Empty states
 * 
 * @module components/shared/ErrorHandling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  WifiOff,
  ServerCrash,
  FileQuestion,
  Search,
  Plus,
  ArrowLeft,
  HelpCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// SECTION ERROR BOUNDARY
// ============================================================================

interface SectionErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

interface SectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Section-level Error Boundary
 * 
 * Catches errors in a specific section without crashing the entire page.
 * Provides a compact fallback UI with retry functionality.
 */
export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, SectionErrorBoundaryState> {
  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Section Error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className={cn("border-red-200 bg-red-50", this.props.className)}>
          <CardContent className="py-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                {this.props.title || 'Something went wrong'}
              </h3>
              <p className="text-sm text-gray-500 mb-4 max-w-sm">
                This section couldn't load properly. Try refreshing or contact support if the issue persists.
              </p>
              <Button onClick={this.handleRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// ERROR DISPLAY COMPONENTS
// ============================================================================

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  errorCode?: string | number;
  className?: string;
}

/**
 * Generic Error Display Component
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  onGoBack,
  onGoHome,
  showDetails = false,
  errorCode,
  className
}) => (
  <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
    <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
      <AlertTriangle className="h-8 w-8 text-red-600" />
    </div>
    
    <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
    <p className="text-gray-500 mb-6 max-w-md">{message}</p>
    
    {errorCode && showDetails && (
      <div className="bg-gray-100 rounded-md px-4 py-2 mb-6">
        <span className="text-sm text-gray-600">Error Code: </span>
        <span className="text-sm font-mono text-gray-900">{errorCode}</span>
      </div>
    )}
    
    <div className="flex flex-wrap gap-3 justify-center">
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
      {onGoBack && (
        <Button variant="outline" onClick={onGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      )}
      {onGoHome && (
        <Button variant="outline" onClick={onGoHome}>
          <Home className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      )}
    </div>
  </div>
);

/**
 * Network Error Display
 */
export const NetworkError: React.FC<Omit<ErrorDisplayProps, 'title' | 'message'>> = (props) => (
  <ErrorDisplay
    {...props}
    title="Connection Error"
    message="Unable to connect to the server. Please check your internet connection and try again."
  />
);

/**
 * Server Error Display
 */
export const ServerError: React.FC<Omit<ErrorDisplayProps, 'title' | 'message'> & { statusCode?: number }> = ({ 
  statusCode, 
  ...props 
}) => (
  <ErrorDisplay
    {...props}
    title="Server Error"
    message={`The server encountered an error${statusCode ? ` (${statusCode})` : ''}. Our team has been notified. Please try again later.`}
    errorCode={statusCode}
    showDetails
  />
);

/**
 * Not Found Error Display
 */
export const NotFoundError: React.FC<Omit<ErrorDisplayProps, 'title' | 'message'> & { resource?: string }> = ({ 
  resource = 'page',
  ...props 
}) => (
  <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", props.className)}>
    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
      <FileQuestion className="h-8 w-8 text-gray-400" />
    </div>
    
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Found</h2>
    <p className="text-gray-500 mb-6 max-w-md">
      The {resource} you're looking for doesn't exist or has been moved.
    </p>
    
    <div className="flex flex-wrap gap-3 justify-center">
      {props.onGoBack && (
        <Button variant="outline" onClick={props.onGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      )}
      {props.onGoHome && (
        <Button onClick={props.onGoHome}>
          <Home className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      )}
    </div>
  </div>
);

/**
 * Access Denied Error Display
 */
export const AccessDeniedError: React.FC<Omit<ErrorDisplayProps, 'title' | 'message'>> = (props) => (
  <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", props.className)}>
    <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mb-6">
      <XCircle className="h-8 w-8 text-amber-600" />
    </div>
    
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
    <p className="text-gray-500 mb-6 max-w-md">
      You don't have permission to access this resource. Please contact your administrator if you believe this is an error.
    </p>
    
    <div className="flex flex-wrap gap-3 justify-center">
      {props.onGoBack && (
        <Button variant="outline" onClick={props.onGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      )}
      {props.onGoHome && (
        <Button onClick={props.onGoHome}>
          <Home className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      )}
    </div>
  </div>
);

// ============================================================================
// EMPTY STATE COMPONENTS
// ============================================================================

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Generic Empty State Component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon,
  action,
  secondaryAction,
  className
}) => (
  <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
      {icon || <FileQuestion className="h-8 w-8 text-gray-400" />}
    </div>
    
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    {message && (
      <p className="text-gray-500 mb-6 max-w-sm">{message}</p>
    )}
    
    <div className="flex flex-wrap gap-3 justify-center">
      {action && (
        <Button onClick={action.onClick}>
          {action.icon || <Plus className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      )}
      {secondaryAction && (
        <Button variant="outline" onClick={secondaryAction.onClick}>
          {secondaryAction.label}
        </Button>
      )}
    </div>
  </div>
);

/**
 * No Results Empty State
 */
export const NoResults: React.FC<{
  searchTerm?: string;
  onClearSearch?: () => void;
  className?: string;
}> = ({ searchTerm, onClearSearch, className }) => (
  <EmptyState
    title="No results found"
    message={searchTerm 
      ? `No results found for "${searchTerm}". Try adjusting your search or filters.`
      : "No results match your current filters."
    }
    icon={<Search className="h-8 w-8 text-gray-400" />}
    action={onClearSearch ? {
      label: 'Clear Search',
      onClick: onClearSearch,
      icon: <XCircle className="h-4 w-4 mr-2" />
    } : undefined}
    className={className}
  />
);

/**
 * No Data Empty State
 */
export const NoData: React.FC<{
  title?: string;
  message?: string;
  onAdd?: () => void;
  addLabel?: string;
  className?: string;
}> = ({ 
  title = 'No data yet',
  message = 'Get started by adding your first item.',
  onAdd,
  addLabel = 'Add New',
  className 
}) => (
  <EmptyState
    title={title}
    message={message}
    icon={<Plus className="h-8 w-8 text-gray-400" />}
    action={onAdd ? {
      label: addLabel,
      onClick: onAdd,
      icon: <Plus className="h-4 w-4 mr-2" />
    } : undefined}
    className={className}
  />
);

// ============================================================================
// INLINE ALERTS
// ============================================================================

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface InlineAlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const alertConfig: Record<AlertVariant, {
  icon: ReactNode;
  className: string;
}> = {
  info: {
    icon: <Info className="h-4 w-4" />,
    className: 'border-blue-200 bg-blue-50 text-blue-800'
  },
  success: {
    icon: <AlertCircle className="h-4 w-4" />,
    className: 'border-green-200 bg-green-50 text-green-800'
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4" />,
    className: 'border-amber-200 bg-amber-50 text-amber-800'
  },
  error: {
    icon: <XCircle className="h-4 w-4" />,
    className: 'border-red-200 bg-red-50 text-red-800'
  }
};

/**
 * Inline Alert Component
 */
export const InlineAlert: React.FC<InlineAlertProps> = ({
  variant = 'info',
  title,
  message,
  onDismiss,
  action,
  className
}) => {
  const config = alertConfig[variant];
  
  return (
    <Alert className={cn(config.className, className)}>
      {config.icon}
      <div className="flex-1">
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{message}</AlertDescription>
      </div>
      <div className="flex items-center gap-2">
        {action && (
          <Button variant="ghost" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

// ============================================================================
// API ERROR HANDLER
// ============================================================================

interface ApiErrorProps {
  error: {
    status?: number;
    message?: string;
    code?: string;
  };
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

/**
 * API Error Display Component
 * 
 * Displays appropriate error UI based on API error status codes.
 */
export const ApiError: React.FC<ApiErrorProps> = ({
  error,
  onRetry,
  compact = false,
  className
}) => {
  const { status, message } = error;

  // Network error
  if (!status || status === 0) {
    return compact ? (
      <InlineAlert
        variant="error"
        message="Network error. Please check your connection."
        action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
        className={className}
      />
    ) : (
      <NetworkError onRetry={onRetry} className={className} />
    );
  }

  // Not found
  if (status === 404) {
    return compact ? (
      <InlineAlert
        variant="warning"
        message={message || "The requested resource was not found."}
        className={className}
      />
    ) : (
      <NotFoundError className={className} />
    );
  }

  // Unauthorized / Forbidden
  if (status === 401 || status === 403) {
    return compact ? (
      <InlineAlert
        variant="error"
        message="You don't have permission to access this resource."
        className={className}
      />
    ) : (
      <AccessDeniedError className={className} />
    );
  }

  // Server error
  if (status >= 500) {
    return compact ? (
      <InlineAlert
        variant="error"
        message={message || "Server error. Please try again later."}
        action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
        className={className}
      />
    ) : (
      <ServerError statusCode={status} onRetry={onRetry} className={className} />
    );
  }

  // Generic error
  return compact ? (
    <InlineAlert
      variant="error"
      message={message || "An error occurred. Please try again."}
      action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
      className={className}
    />
  ) : (
    <ErrorDisplay
      message={message}
      errorCode={status}
      showDetails
      onRetry={onRetry}
      className={className}
    />
  );
};

export default {
  SectionErrorBoundary,
  ErrorDisplay,
  NetworkError,
  ServerError,
  NotFoundError,
  AccessDeniedError,
  EmptyState,
  NoResults,
  NoData,
  InlineAlert,
  ApiError
};
