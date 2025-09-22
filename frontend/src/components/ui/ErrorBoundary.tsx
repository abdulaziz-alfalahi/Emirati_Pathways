/**
 * Error Boundary Component with Analytics Integration
 * 
 * Installation Location: emirati-journey-platform/src/components/ui/ErrorBoundary.tsx
 * 
 * This component catches React errors and automatically reports them to the analytics system.
 * It provides a fallback UI and integrates with the enhanced analytics for error tracking.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  enableReporting?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report error to analytics if enabled
    if (this.props.enableReporting !== false) {
      this.reportErrorToAnalytics(error, errorInfo);
    }

    // Log error to console in development
    if (import.meta.env.VITE_ENVIRONMENT === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  private async reportErrorToAnalytics(error: Error, errorInfo: ErrorInfo) {
    try {
      // Dynamic import to avoid circular dependencies
      const { enhancedAnalyticsService } = await import('../../services/enhancedAnalyticsService');
      
      await enhancedAnalyticsService.trackEventImmediate({
        event_type: 'ERROR_EVENT',
        category: 'system_performance',
        action: 'react_error_boundary',
        label: error.message,
        data: {
          error_name: error.name,
          error_message: error.message,
          error_stack: error.stack,
          component_stack: errorInfo.componentStack,
          error_id: this.state.errorId,
          retry_count: this.retryCount,
          user_agent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        },
        metadata: {
          source: 'error_boundary',
          severity: 'high',
          category: 'react_error'
        }
      });
    } catch (analyticsError) {
      console.error('Failed to report error to analytics:', analyticsError);
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    
    const bugReport = {
      errorId,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      },
      errorInfo: {
        componentStack: errorInfo?.componentStack
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    // Create mailto link with bug report
    const subject = encodeURIComponent(`Bug Report - Error ID: ${errorId}`);
    const body = encodeURIComponent(`
Bug Report Details:

Error ID: ${errorId}
Error: ${error?.name} - ${error?.message}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}

Component Stack:
${errorInfo?.componentStack}

Error Stack:
${error?.stack}

Additional Information:
Please describe what you were doing when this error occurred.
    `);

    window.open(`mailto:support@emiratijourney.ae?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              {/* Error Title */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Oops! Something went wrong
                </h2>
                <p className="text-gray-600">
                  We're sorry, but something unexpected happened. Our team has been notified.
                </p>
              </div>

              {/* Error ID */}
              {this.state.errorId && (
                <div className="bg-gray-50 rounded-md p-3 mb-6">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Error ID: </span>
                    <span className="font-mono text-gray-600">{this.state.errorId}</span>
                  </div>
                </div>
              )}

              {/* Error Details (Development/Debug Mode) */}
              {(this.props.showDetails || import.meta.env.VITE_ENVIRONMENT === 'development') && this.state.error && (
                <div className="mb-6">
                  <details className="bg-red-50 border border-red-200 rounded-md p-4">
                    <summary className="cursor-pointer font-medium text-red-800 mb-2">
                      Error Details (Click to expand)
                    </summary>
                    <div className="text-sm text-red-700 space-y-2">
                      <div>
                        <strong>Error:</strong> {this.state.error.name}
                      </div>
                      <div>
                        <strong>Message:</strong> {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <div>
                          <strong>Stack Trace:</strong>
                          <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                            {this.state.error.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Retry Button */}
                {this.retryCount < this.maxRetries && (
                  <button
                    onClick={this.handleRetry}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </button>
                )}

                {/* Reload Page Button */}
                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </button>

                {/* Go Home Button */}
                <button
                  onClick={this.handleGoHome}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </button>

                {/* Report Bug Button */}
                <button
                  onClick={this.handleReportBug}
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Report This Bug
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  If this problem persists, please contact our support team with the Error ID above.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// FUNCTIONAL ERROR BOUNDARY HOOK
// ============================================================================

/**
 * Hook to use error boundary functionality in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback(async (error: Error, context?: Record<string, any>) => {
    setError(error);

    // Report to analytics
    try {
      const { enhancedAnalyticsService } = await import('../../services/enhancedAnalyticsService');
      
      await enhancedAnalyticsService.trackEventImmediate({
        event_type: 'ERROR_EVENT',
        category: 'system_performance',
        action: 'manual_error_capture',
        label: error.message,
        data: {
          error_name: error.name,
          error_message: error.message,
          error_stack: error.stack,
          context,
          user_agent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        },
        metadata: {
          source: 'error_handler_hook',
          severity: 'medium'
        }
      });
    } catch (analyticsError) {
      console.error('Failed to report error to analytics:', analyticsError);
    }
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// ============================================================================
// ERROR BOUNDARY WITH ANALYTICS CONTEXT
// ============================================================================

interface AnalyticsErrorBoundaryProps extends Props {
  userId?: string;
  sessionId?: string;
  additionalContext?: Record<string, any>;
}

export const AnalyticsErrorBoundary: React.FC<AnalyticsErrorBoundaryProps> = ({
  children,
  userId,
  sessionId,
  additionalContext,
  ...props
}) => {
  const handleError = async (error: Error, errorInfo: ErrorInfo) => {
    // Call original error handler
    if (props.onError) {
      props.onError(error, errorInfo);
    }

    // Enhanced analytics reporting with context
    try {
      const { enhancedAnalyticsService } = await import('../../services/enhancedAnalyticsService');
      
      await enhancedAnalyticsService.trackEventImmediate({
        event_type: 'ERROR_EVENT',
        category: 'system_performance',
        action: 'react_error_boundary_analytics',
        label: error.message,
        user_id: userId,
        session_id: sessionId,
        data: {
          error_name: error.name,
          error_message: error.message,
          error_stack: error.stack,
          component_stack: errorInfo.componentStack,
          user_agent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          ...additionalContext
        },
        metadata: {
          source: 'analytics_error_boundary',
          severity: 'high',
          has_user_context: !!userId
        }
      });
    } catch (analyticsError) {
      console.error('Failed to report error to analytics:', analyticsError);
    }
  };

  return (
    <ErrorBoundary {...props} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;

