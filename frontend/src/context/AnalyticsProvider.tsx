/**
 * Enhanced Analytics Context Provider
 * 
 * Installation Location: emirati-journey-platform/src/context/AnalyticsProvider.tsx
 * 
 * This provider manages the global analytics state and configuration across the application.
 * It provides analytics context, user preferences, and automatic event tracking.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getAuthToken } from '../utils/tokenUtils';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext'; // Adjust import path as needed
import { useRole } from './RoleContext'; // Adjust import path as needed
import {
  enhancedAnalyticsService,
  getEnhancedAnalyticsService
} from '../services/enhancedAnalyticsService';
import {
  useAnalyticsHealth,
  useQuickEventTracking,
  useWebSocketAnalytics,
  useAnalyticsPerformance
} from '../hooks/useEnhancedAnalytics';
import {
  EnhancedAnalyticsEvent,
  AnalyticsHealthStatus,
  DeviceInfo,
  LocationInfo,
  UAEMetrics,
  CulturalContext,
  TimeWindow,
  Emirate,
  Sector
} from '../types/enhancedAnalytics';

// ============================================================================
// ANALYTICS CONFIGURATION INTERFACE
// ============================================================================

export interface AnalyticsConfig {
  enabled: boolean;
  enableRealTimeUpdates: boolean;
  enableWebSocket: boolean;
  enablePerformanceTracking: boolean;
  enableErrorTracking: boolean;
  enableUserJourneyTracking: boolean;
  enableUAESpecificTracking: boolean;
  defaultTimeWindow: TimeWindow;
  autoTrackPageViews: boolean;
  autoTrackUserActions: boolean;
  batchEventTracking: boolean;
  debugMode: boolean;
  privacyMode: boolean;
  dataRetentionDays: number;
}

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: true,
  enableRealTimeUpdates: true,
  enableWebSocket: true,
  enablePerformanceTracking: true,
  enableErrorTracking: true,
  enableUserJourneyTracking: true,
  enableUAESpecificTracking: true,
  defaultTimeWindow: '1h',
  autoTrackPageViews: true,
  autoTrackUserActions: false,
  batchEventTracking: true,
  debugMode: import.meta.env.VITE_ENVIRONMENT !== 'production',
  privacyMode: false,
  dataRetentionDays: 90
};

// ============================================================================
// USER PREFERENCES INTERFACE
// ============================================================================

export interface AnalyticsUserPreferences {
  allowTracking: boolean;
  allowPerformanceTracking: boolean;
  allowErrorTracking: boolean;
  allowLocationTracking: boolean;
  preferredLanguage: 'ar' | 'en' | 'auto';
  dashboardRefreshInterval: number;
  notificationsEnabled: boolean;
  emailReportsEnabled: boolean;
  dataExportFormat: 'csv' | 'excel' | 'json' | 'pdf';
}

export const DEFAULT_USER_PREFERENCES: AnalyticsUserPreferences = {
  allowTracking: true,
  allowPerformanceTracking: true,
  allowErrorTracking: true,
  allowLocationTracking: false,
  preferredLanguage: 'auto',
  dashboardRefreshInterval: 30000, // 30 seconds
  notificationsEnabled: true,
  emailReportsEnabled: false,
  dataExportFormat: 'excel'
};

// ============================================================================
// ANALYTICS CONTEXT INTERFACE
// ============================================================================

export interface AnalyticsContextValue {
  // Configuration
  config: AnalyticsConfig;
  updateConfig: (updates: Partial<AnalyticsConfig>) => void;
  
  // User Preferences
  preferences: AnalyticsUserPreferences;
  updatePreferences: (updates: Partial<AnalyticsUserPreferences>) => void;
  
  // Service Status
  isServiceHealthy: boolean;
  healthStatus?: AnalyticsHealthStatus;
  
  // User Context
  userId?: string;
  sessionId: string;
  deviceInfo: DeviceInfo;
  locationInfo?: LocationInfo;
  uaeMetrics?: UAEMetrics;
  culturalContext: CulturalContext;
  
  // Tracking Methods
  trackEvent: (event: Omit<EnhancedAnalyticsEvent, 'timestamp' | 'session_id' | 'user_id'>) => Promise<void>;
  trackPageView: (pageName: string, additionalData?: Record<string, any>) => void;
  trackUserAction: (action: string, category: string, label?: string, value?: number) => void;
  trackError: (error: Error, context?: Record<string, any>) => void;
  
  // Performance
  performanceData: {
    pageLoadTime?: number;
    apiResponseTimes: Record<string, number>;
    errorCount: number;
  };
  
  // WebSocket Status
  isWebSocketConnected: boolean;
  
  // Utility Methods
  resetAnalytics: () => void;
  exportUserData: () => Promise<Blob>;
  clearUserData: () => Promise<void>;
}

// ============================================================================
// ANALYTICS CONTEXT
// ============================================================================

const AnalyticsContext = createContext<AnalyticsContextValue | undefined>(undefined);

// ============================================================================
// ANALYTICS PROVIDER COMPONENT
// ============================================================================

interface AnalyticsProviderProps {
  children: ReactNode;
  initialConfig?: Partial<AnalyticsConfig>;
  initialPreferences?: Partial<AnalyticsUserPreferences>;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
  initialConfig = {},
  initialPreferences = {}
}) => {
  // ============================================================================
  // HOOKS AND STATE
  // ============================================================================

  const { user } = useAuth();
  const { activeRole } = useRole();
  const { i18n } = useTranslation();
  
  // Configuration state
  const [config, setConfig] = useState<AnalyticsConfig>(() => {
    const savedConfig = localStorage.getItem('analytics_config');
    const parsedConfig = savedConfig ? JSON.parse(savedConfig) : {};
    return { ...DEFAULT_ANALYTICS_CONFIG, ...parsedConfig, ...initialConfig };
  });
  
  // User preferences state
  const [preferences, setPreferences] = useState<AnalyticsUserPreferences>(() => {
    const savedPreferences = localStorage.getItem('analytics_preferences');
    const parsedPreferences = savedPreferences ? JSON.parse(savedPreferences) : {};
    return { ...DEFAULT_USER_PREFERENCES, ...parsedPreferences, ...initialPreferences };
  });
  
  // Session and device info
  const [sessionId] = useState(() => {
    let id = sessionStorage.getItem('analytics_session_id');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', id);
    }
    return id;
  });
  
  const [deviceInfo] = useState<DeviceInfo>(() => ({
    browser: navigator.userAgent,
    os: navigator.platform,
    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    screen_resolution: `${screen.width}x${screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }));
  
  const [locationInfo, setLocationInfo] = useState<LocationInfo | undefined>();
  const [uaeMetrics, setUAEMetrics] = useState<UAEMetrics | undefined>();
  
  // Cultural context based on current language
  const culturalContext: CulturalContext = {
    language_used: i18n.language as 'ar' | 'en',
    local_context_score: i18n.language === 'ar' ? 1.0 : 0.5
  };
  
  // ============================================================================
  // ANALYTICS HOOKS
  // ============================================================================

  const { data: healthStatus, isError: healthError } = useAnalyticsHealth({
    enabled: config.enabled,
    refetchInterval: preferences.dashboardRefreshInterval
  });
  
  const { trackPageView, trackUserAction, trackError, isTracking } = useQuickEventTracking();
  
  const { isConnected: isWebSocketConnected } = useWebSocketAnalytics({
    enabled: config.enabled && config.enableWebSocket
  });
  
  const { performanceData, recordApiResponseTime, recordError } = useAnalyticsPerformance();
  
  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const isServiceHealthy = !healthError && healthStatus?.status === 'healthy';
  const userId = user?.id;
  
  // ============================================================================
  // CONFIGURATION METHODS
  // ============================================================================

  const updateConfig = useCallback((updates: Partial<AnalyticsConfig>) => {
    setConfig(prev => {
      const newConfig = { ...prev, ...updates };
      localStorage.setItem('analytics_config', JSON.stringify(newConfig));
      return newConfig;
    });
  }, []);
  
  const updatePreferences = useCallback((updates: Partial<AnalyticsUserPreferences>) => {
    setPreferences(prev => {
      const newPreferences = { ...prev, ...updates };
      localStorage.setItem('analytics_preferences', JSON.stringify(newPreferences));
      return newPreferences;
    });
  }, []);
  
  // ============================================================================
  // TRACKING METHODS
  // ============================================================================

  const trackEvent = useCallback(async (
    event: Omit<EnhancedAnalyticsEvent, 'timestamp' | 'session_id' | 'user_id'>
  ) => {
    if (!config.enabled || !preferences.allowTracking) {
      return;
    }
    
    const enhancedEvent: EnhancedAnalyticsEvent = {
      ...event,
      user_id: userId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      device_info: preferences.allowPerformanceTracking ? deviceInfo : undefined,
      location_info: preferences.allowLocationTracking ? locationInfo : undefined,
      uae_metrics: config.enableUAESpecificTracking ? uaeMetrics : undefined,
      cultural_context: culturalContext,
      metadata: {
        ...event.metadata,
        user_role: activeRole,
        tracking_preferences: {
          performance: preferences.allowPerformanceTracking,
          location: preferences.allowLocationTracking,
          error: preferences.allowErrorTracking
        }
      }
    };
    
    try {
      if (config.batchEventTracking) {
        await enhancedAnalyticsService.trackEvent(enhancedEvent);
      } else {
        await enhancedAnalyticsService.trackEventImmediate(enhancedEvent);
      }
    } catch (error) {
      if (config.debugMode) {
        console.error('Failed to track analytics event:', error);
      }
    }
  }, [
    config.enabled,
    config.enableUAESpecificTracking,
    config.batchEventTracking,
    config.debugMode,
    preferences.allowTracking,
    preferences.allowPerformanceTracking,
    preferences.allowLocationTracking,
    userId,
    sessionId,
    deviceInfo,
    locationInfo,
    uaeMetrics,
    culturalContext,
    activeRole
  ]);
  
  const enhancedTrackPageView = useCallback((pageName: string, additionalData?: Record<string, any>) => {
    if (config.autoTrackPageViews) {
      trackPageView(pageName, additionalData);
    }
  }, [config.autoTrackPageViews, trackPageView]);
  
  const enhancedTrackUserAction = useCallback((action: string, category: string, label?: string, value?: number) => {
    if (config.autoTrackUserActions) {
      trackUserAction(action, category, label, value);
    }
  }, [config.autoTrackUserActions, trackUserAction]);
  
  const enhancedTrackError = useCallback((error: Error, context?: Record<string, any>) => {
    if (config.enableErrorTracking && preferences.allowErrorTracking) {
      trackError(error, context);
      recordError();
    }
  }, [config.enableErrorTracking, preferences.allowErrorTracking, trackError, recordError]);
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  const resetAnalytics = useCallback(() => {
    // Clear local storage
    localStorage.removeItem('analytics_config');
    localStorage.removeItem('analytics_preferences');
    sessionStorage.removeItem('analytics_session_id');
    
    // Reset state to defaults
    setConfig(DEFAULT_ANALYTICS_CONFIG);
    setPreferences(DEFAULT_USER_PREFERENCES);
    
    // Clear service token
    enhancedAnalyticsService.clearAuthToken();
  }, []);
  
  const exportUserData = useCallback(async (): Promise<Blob> => {
    const userData = {
      config,
      preferences,
      sessionId,
      deviceInfo,
      locationInfo,
      uaeMetrics,
      culturalContext,
      exportDate: new Date().toISOString()
    };
    
    return new Blob([JSON.stringify(userData, null, 2)], {
      type: 'application/json'
    });
  }, [config, preferences, sessionId, deviceInfo, locationInfo, uaeMetrics, culturalContext]);
  
  const clearUserData = useCallback(async (): Promise<void> => {
    try {
      // Clear analytics data on server if user is authenticated
      if (userId) {
        // This would need to be implemented in the backend
        // await enhancedAnalyticsService.clearUserData(userId);
      }
      
      // Clear local data
      resetAnalytics();
    } catch (error) {
      console.error('Failed to clear user data:', error);
      throw error;
    }
  }, [userId, resetAnalytics]);
  
  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Initialize location info if allowed
  useEffect(() => {
    if (preferences.allowLocationTracking && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationInfo({
            country: 'AE', // Default to UAE
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }
          });
        },
        (error) => {
          if (config.debugMode) {
            console.warn('Failed to get location:', error);
          }
        }
      );
    }
  }, [preferences.allowLocationTracking, config.debugMode]);
  
  // Initialize UAE metrics based on user profile
  useEffect(() => {
    if (config.enableUAESpecificTracking && user) {
      // Extract UAE-specific metrics from user profile
      const metrics: UAEMetrics = {
        arabic_proficiency: user.arabic_proficiency as any,
        uae_experience_years: user.uae_experience_years,
        sector_preference: user.preferred_sector as Sector,
        emirate_preference: user.preferred_emirate as Emirate,
        government_sector_interest: user.government_sector_interest,
        local_education: user.local_education
      };
      
      setUAEMetrics(metrics);
    }
  }, [config.enableUAESpecificTracking, user]);
  
  // Set up authentication token
  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      enhancedAnalyticsService.setAuthToken(token);
    }
  }, [user]);
  
  // Set up error tracking
  useEffect(() => {
    if (config.enableErrorTracking && preferences.allowErrorTracking) {
      const handleError = (event: ErrorEvent) => {
        enhancedTrackError(new Error(event.message), {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      };
      
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        enhancedTrackError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
          type: 'unhandled_promise_rejection'
        });
      };
      
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      
      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      };
    }
  }, [config.enableErrorTracking, preferences.allowErrorTracking, enhancedTrackError]);
  
  // Track page views automatically
  useEffect(() => {
    if (config.autoTrackPageViews) {
      const currentPath = window.location.pathname;
      enhancedTrackPageView(currentPath);
    }
  }, [config.autoTrackPageViews, enhancedTrackPageView]);
  
  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: AnalyticsContextValue = {
    // Configuration
    config,
    updateConfig,
    
    // User Preferences
    preferences,
    updatePreferences,
    
    // Service Status
    isServiceHealthy,
    healthStatus,
    
    // User Context
    userId,
    sessionId,
    deviceInfo,
    locationInfo,
    uaeMetrics,
    culturalContext,
    
    // Tracking Methods
    trackEvent,
    trackPageView: enhancedTrackPageView,
    trackUserAction: enhancedTrackUserAction,
    trackError: enhancedTrackError,
    
    // Performance
    performanceData,
    
    // WebSocket Status
    isWebSocketConnected,
    
    // Utility Methods
    resetAnalytics,
    exportUserData,
    clearUserData
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// ============================================================================
// HOOK TO USE ANALYTICS CONTEXT
// ============================================================================

export const useAnalytics = (): AnalyticsContextValue => {
  const context = useContext(AnalyticsContext);
  
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  return context;
};

// ============================================================================
// ANALYTICS HOC
// ============================================================================

export interface WithAnalyticsProps {
  analytics: AnalyticsContextValue;
}

export function withAnalytics<P extends WithAnalyticsProps>(
  Component: React.ComponentType<P>
): React.ComponentType<Omit<P, 'analytics'>> {
  return function WrappedComponent(props: Omit<P, 'analytics'>) {
    const analytics = useAnalytics();
    return <Component {...(props as P)} analytics={analytics} />;
  };
}

// ============================================================================
// ANALYTICS SETTINGS COMPONENT
// ============================================================================

export const AnalyticsSettings: React.FC = () => {
  const { config, updateConfig, preferences, updatePreferences } = useAnalytics();
  const { t } = useTranslation('analytics');
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t('settings.title', 'Analytics Settings')}</h3>
        <p className="text-sm text-gray-600">
          {t('settings.description', 'Configure your analytics preferences and privacy settings.')}
        </p>
      </div>
      
      {/* Analytics Configuration */}
      <div className="space-y-4">
        <h4 className="font-medium">{t('settings.configuration', 'Configuration')}</h4>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
          />
          <span>{t('settings.enableAnalytics', 'Enable Analytics')}</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.enableRealTimeUpdates}
            onChange={(e) => updateConfig({ enableRealTimeUpdates: e.target.checked })}
          />
          <span>{t('settings.enableRealTime', 'Enable Real-time Updates')}</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.enableUAESpecificTracking}
            onChange={(e) => updateConfig({ enableUAESpecificTracking: e.target.checked })}
          />
          <span>{t('settings.enableUAETracking', 'Enable UAE-specific Tracking')}</span>
        </label>
      </div>
      
      {/* Privacy Preferences */}
      <div className="space-y-4">
        <h4 className="font-medium">{t('settings.privacy', 'Privacy')}</h4>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={preferences.allowTracking}
            onChange={(e) => updatePreferences({ allowTracking: e.target.checked })}
          />
          <span>{t('settings.allowTracking', 'Allow Event Tracking')}</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={preferences.allowPerformanceTracking}
            onChange={(e) => updatePreferences({ allowPerformanceTracking: e.target.checked })}
          />
          <span>{t('settings.allowPerformance', 'Allow Performance Tracking')}</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={preferences.allowLocationTracking}
            onChange={(e) => updatePreferences({ allowLocationTracking: e.target.checked })}
          />
          <span>{t('settings.allowLocation', 'Allow Location Tracking')}</span>
        </label>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AnalyticsProvider;

export type {
  AnalyticsConfig,
  AnalyticsUserPreferences,
  AnalyticsContextValue
};

