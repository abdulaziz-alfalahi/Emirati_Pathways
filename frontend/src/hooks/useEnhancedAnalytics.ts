/**
 * Enhanced Analytics React Hooks
 * 
 * Installation Location: emirati-journey-platform/src/hooks/useEnhancedAnalytics.ts
 * 
 * This file provides React hooks for managing enhanced analytics data with React Query.
 * It includes hooks for real-time metrics, UAE analytics, event tracking, and health monitoring.
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  enhancedAnalyticsService,
  EnhancedAnalyticsError,
  trackAnalyticsEvent as serviceTrackEvent
} from '../services/enhancedAnalyticsService';
import {
  RealTimeMetrics,
  UAEAnalyticsDashboard,
  AnalyticsHealthStatus,
  EnhancedAnalyticsEvent,
  TimeWindow,
  AnalyticsFilters,
  SearchCriteria,
  PaginatedResponse,
  ReportConfig,
  ExportOptions,
  REFRESH_INTERVALS
} from '../types/enhancedAnalytics';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const ANALYTICS_QUERY_KEYS = {
  health: ['analytics', 'health'] as const,
  realTimeMetrics: (window: TimeWindow, filters?: AnalyticsFilters) => 
    ['analytics', 'realtime', window, filters] as const,
  uaeDashboard: (dateRange?: { start: string; end: string }) => 
    ['analytics', 'uae', dateRange] as const,
  metricsHistory: (metric: string, window: TimeWindow, filters?: AnalyticsFilters) => 
    ['analytics', 'history', metric, window, filters] as const,
  searchEvents: (criteria: SearchCriteria) => 
    ['analytics', 'events', 'search', criteria] as const,
} as const;

// ============================================================================
// HEALTH CHECK HOOK
// ============================================================================

interface UseAnalyticsHealthOptions extends Omit<UseQueryOptions<AnalyticsHealthStatus, EnhancedAnalyticsError>, 'queryKey' | 'queryFn'> {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
}

export const useAnalyticsHealth = (options: UseAnalyticsHealthOptions = {}) => {
  const {
    enableAutoRefresh = true,
    refreshInterval = REFRESH_INTERVALS.HEALTH_CHECK,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.health,
    queryFn: () => enhancedAnalyticsService.getHealthStatus(),
    refetchInterval: enableAutoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: true,
    staleTime: 10000, // 10 seconds
    retry: (failureCount, error) => {
      // Don't retry on authentication errors
      if (error instanceof EnhancedAnalyticsError && error.code === 'AUTHENTICATION_REQUIRED') {
        return false;
      }
      return failureCount < 3;
    },
    ...queryOptions
  });
};

// ============================================================================
// REAL-TIME METRICS HOOKS
// ============================================================================

interface UseRealTimeMetricsOptions extends Omit<UseQueryOptions<RealTimeMetrics, EnhancedAnalyticsError>, 'queryKey' | 'queryFn'> {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  filters?: AnalyticsFilters;
}

export const useRealTimeMetrics = (
  window: TimeWindow = '1h',
  options: UseRealTimeMetricsOptions = {}
) => {
  const {
    enableAutoRefresh = true,
    refreshInterval = REFRESH_INTERVALS.REAL_TIME,
    filters,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.realTimeMetrics(window, filters),
    queryFn: () => filters 
      ? enhancedAnalyticsService.getRealTimeMetricsWithFilters(window, filters)
      : enhancedAnalyticsService.getRealTimeMetrics(window),
    refetchInterval: enableAutoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: true,
    staleTime: 15000, // 15 seconds
    retry: 2,
    ...queryOptions
  });
};

// Hook for multiple time windows
export const useRealTimeMetricsMultiWindow = (
  windows: TimeWindow[] = ['5m', '1h', '1d'],
  options: UseRealTimeMetricsOptions = {}
) => {
  const results = windows.map(window => 
    useRealTimeMetrics(window, { ...options, enabled: options.enabled !== false })
  );

  return {
    data: results.reduce((acc, result, index) => {
      acc[windows[index]] = result.data;
      return acc;
    }, {} as Record<TimeWindow, RealTimeMetrics | undefined>),
    isLoading: results.some(result => result.isLoading),
    isError: results.some(result => result.isError),
    errors: results.map(result => result.error).filter(Boolean),
    refetch: () => Promise.all(results.map(result => result.refetch()))
  };
};

// ============================================================================
// UAE ANALYTICS HOOKS
// ============================================================================

interface UseUAEAnalyticsOptions extends Omit<UseQueryOptions<UAEAnalyticsDashboard, EnhancedAnalyticsError>, 'queryKey' | 'queryFn'> {
  enableAutoRefresh?: boolean;
  refreshInterval?: number;
  dateRange?: { start: string; end: string };
}

export const useUAEAnalytics = (options: UseUAEAnalyticsOptions = {}) => {
  const {
    enableAutoRefresh = true,
    refreshInterval = REFRESH_INTERVALS.DASHBOARD,
    dateRange,
    ...queryOptions
  } = options;

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.uaeDashboard(dateRange),
    queryFn: () => dateRange 
      ? enhancedAnalyticsService.getUAEDashboardWithDateRange(dateRange.start, dateRange.end)
      : enhancedAnalyticsService.getUAEDashboard(),
    refetchInterval: enableAutoRefresh ? refreshInterval : false,
    refetchIntervalInBackground: false,
    staleTime: 30000, // 30 seconds
    retry: 2,
    ...queryOptions
  });
};

// ============================================================================
// METRICS HISTORY HOOK
// ============================================================================

interface UseMetricsHistoryOptions extends Omit<UseQueryOptions<any[], EnhancedAnalyticsError>, 'queryKey' | 'queryFn'> {
  filters?: AnalyticsFilters;
}

export const useMetricsHistory = (
  metricName: string,
  window: TimeWindow,
  options: UseMetricsHistoryOptions = {}
) => {
  const { filters, ...queryOptions } = options;

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.metricsHistory(metricName, window, filters),
    queryFn: () => enhancedAnalyticsService.getMetricsHistory(metricName, window, filters),
    staleTime: 60000, // 1 minute
    retry: 2,
    enabled: !!metricName,
    ...queryOptions
  });
};

// ============================================================================
// EVENT SEARCH HOOK
// ============================================================================

interface UseEventSearchOptions extends Omit<UseQueryOptions<PaginatedResponse<EnhancedAnalyticsEvent>, EnhancedAnalyticsError>, 'queryKey' | 'queryFn'> {
  autoSearch?: boolean;
}

export const useEventSearch = (
  criteria: SearchCriteria,
  options: UseEventSearchOptions = {}
) => {
  const { autoSearch = false, ...queryOptions } = options;

  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.searchEvents(criteria),
    queryFn: () => enhancedAnalyticsService.searchEvents(criteria),
    enabled: autoSearch && !!criteria.query,
    staleTime: 30000,
    retry: 1,
    ...queryOptions
  });
};

// ============================================================================
// EVENT TRACKING HOOKS
// ============================================================================

interface UseEventTrackingOptions extends UseMutationOptions<void, EnhancedAnalyticsError, EnhancedAnalyticsEvent> {
  immediate?: boolean;
}

export const useEventTracking = (options: UseEventTrackingOptions = {}) => {
  const { immediate = false, ...mutationOptions } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (event: EnhancedAnalyticsEvent) => 
      immediate 
        ? enhancedAnalyticsService.trackEventImmediate(event)
        : enhancedAnalyticsService.trackEvent(event),
    onSuccess: () => {
      // Invalidate real-time metrics to reflect new events
      queryClient.invalidateQueries({ 
        queryKey: ['analytics', 'realtime'] 
      });
    },
    ...mutationOptions
  });
};

// Batch event tracking
export const useBatchEventTracking = (options: UseMutationOptions<void, EnhancedAnalyticsError, EnhancedAnalyticsEvent[]> = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (events: EnhancedAnalyticsEvent[]) => 
      enhancedAnalyticsService.trackBatchEvents(events),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['analytics', 'realtime'] 
      });
    },
    ...options
  });
};

// ============================================================================
// EXPORT AND REPORTING HOOKS
// ============================================================================

export const useReportGeneration = (options: UseMutationOptions<Blob, EnhancedAnalyticsError, ReportConfig> = {}) => {
  return useMutation({
    mutationFn: (config: ReportConfig) => enhancedAnalyticsService.generateReport(config),
    ...options
  });
};

export const useDataExport = (options: UseMutationOptions<Blob, EnhancedAnalyticsError, ExportOptions> = {}) => {
  return useMutation({
    mutationFn: (exportOptions: ExportOptions) => enhancedAnalyticsService.exportData(exportOptions),
    ...options
  });
};

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

// Quick event tracking with common patterns
export const useQuickEventTracking = () => {
  const trackEvent = useEventTracking();
  const { i18n } = useTranslation();

  const trackPageView = useCallback((pageName: string, additionalData?: Record<string, any>) => {
    return trackEvent.mutate({
      event_type: 'USER_ACTION',
      category: 'navigation',
      action: 'page_view',
      label: pageName,
      cultural_context: {
        language_used: i18n.language as 'ar' | 'en'
      },
      data: additionalData
    });
  }, [trackEvent, i18n.language]);

  const trackUserAction = useCallback((action: string, category: string, label?: string, value?: number) => {
    return trackEvent.mutate({
      event_type: 'USER_ACTION',
      category: category as any,
      action,
      label,
      value,
      cultural_context: {
        language_used: i18n.language as 'ar' | 'en'
      }
    });
  }, [trackEvent, i18n.language]);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    return trackEvent.mutate({
      event_type: 'ERROR_EVENT',
      category: 'system_performance',
      action: 'error_occurred',
      label: error.message,
      data: {
        error_name: error.name,
        error_stack: error.stack,
        ...context
      }
    });
  }, [trackEvent]);

  return {
    trackPageView,
    trackUserAction,
    trackError,
    isTracking: trackEvent.isPending
  };
};

// Real-time dashboard data hook
export const useRealTimeDashboard = (window: TimeWindow = '1h') => {
  const healthQuery = useAnalyticsHealth();
  const metricsQuery = useRealTimeMetrics(window);
  const uaeQuery = useUAEAnalytics({ enableAutoRefresh: false });

  return {
    health: healthQuery.data,
    metrics: metricsQuery.data,
    uaeData: uaeQuery.data,
    isLoading: healthQuery.isLoading || metricsQuery.isLoading || uaeQuery.isLoading,
    isError: healthQuery.isError || metricsQuery.isError || uaeQuery.isError,
    errors: [healthQuery.error, metricsQuery.error, uaeQuery.error].filter(Boolean),
    refetch: () => Promise.all([
      healthQuery.refetch(),
      metricsQuery.refetch(),
      uaeQuery.refetch()
    ])
  };
};

// ============================================================================
// WEBSOCKET HOOK FOR REAL-TIME UPDATES
// ============================================================================

interface UseWebSocketAnalyticsOptions {
  enabled?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export const useWebSocketAnalytics = (options: UseWebSocketAnalyticsOptions = {}) => {
  const {
    enabled = true,
    reconnectAttempts = 5,
    reconnectInterval = 5000
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${import.meta.env.VITE_WS_URL || ''}/ws/analytics`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        reconnectCountRef.current = 0;
        console.log('WebSocket connected to analytics');
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);

          // Invalidate relevant queries based on message type
          if (message.type === 'metrics_update') {
            queryClient.invalidateQueries({ 
              queryKey: ['analytics', 'realtime'] 
            });
          } else if (message.type === 'uae_update') {
            queryClient.invalidateQueries({ 
              queryKey: ['analytics', 'uae'] 
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        
        // Attempt reconnection
        if (reconnectCountRef.current < reconnectAttempts) {
          reconnectCountRef.current++;
          setTimeout(connect, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }, [enabled, reconnectAttempts, reconnectInterval, queryClient]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect
  };
};

// ============================================================================
// ANALYTICS CONTEXT HOOK
// ============================================================================

interface AnalyticsContextData {
  isEnabled: boolean;
  userId?: string;
  sessionId?: string;
  deviceInfo?: any;
  locationInfo?: any;
}

export const useAnalyticsContext = (): AnalyticsContextData => {
  const [contextData, setContextData] = useState<AnalyticsContextData>({
    isEnabled: true
  });

  useEffect(() => {
    // Get user context from auth or other sources
    const userId = localStorage.getItem('user_id') || undefined;
    const sessionId = sessionStorage.getItem('analytics_session_id') || undefined;
    
    // Get device info
    const deviceInfo = {
      browser: navigator.userAgent,
      language: navigator.language,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    setContextData({
      isEnabled: true,
      userId,
      sessionId,
      deviceInfo
    });
  }, []);

  return contextData;
};

// ============================================================================
// PERFORMANCE MONITORING HOOK
// ============================================================================

export const useAnalyticsPerformance = () => {
  const [performanceData, setPerformanceData] = useState<{
    pageLoadTime?: number;
    apiResponseTimes: Record<string, number>;
    errorCount: number;
  }>({
    apiResponseTimes: {},
    errorCount: 0
  });

  useEffect(() => {
    // Monitor page load time
    if (typeof window !== 'undefined' && window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      setPerformanceData(prev => ({ ...prev, pageLoadTime: loadTime }));
    }
  }, []);

  const recordApiResponseTime = useCallback((endpoint: string, responseTime: number) => {
    setPerformanceData(prev => ({
      ...prev,
      apiResponseTimes: {
        ...prev.apiResponseTimes,
        [endpoint]: responseTime
      }
    }));
  }, []);

  const recordError = useCallback(() => {
    setPerformanceData(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1
    }));
  }, []);

  return {
    performanceData,
    recordApiResponseTime,
    recordError
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export {
  enhancedAnalyticsService,
  serviceTrackEvent as trackAnalyticsEvent,
  EnhancedAnalyticsError
};

// Re-export types for convenience
export type {
  RealTimeMetrics,
  UAEAnalyticsDashboard,
  AnalyticsHealthStatus,
  EnhancedAnalyticsEvent,
  TimeWindow,
  AnalyticsFilters
};


