/**
 * Analytics Service Integration Layer
 * 
 * Installation Location: emirati-journey-platform/src/services/analyticsServiceIntegration.ts
 * 
 * This file provides backward compatibility with the existing analyticsService.ts
 * while adding enhanced analytics capabilities. It acts as a bridge between
 * the old and new analytics systems.
 */

import { enhancedAnalyticsService, EnhancedAnalyticsError } from './enhancedAnalyticsService';
import {
  EnhancedAnalyticsEvent,
  RealTimeMetrics,
  UAEAnalyticsDashboard,
  AnalyticsHealthStatus,
  TimeWindow,
  AnalyticsFilters
} from '../types/enhancedAnalytics';

// ============================================================================
// EXISTING ANALYTICS SERVICE TYPES (for backward compatibility)
// ============================================================================

interface LegacyAnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  timestamp?: string;
}

interface LegacyUserData {
  userId: string;
  role: string;
  preferences?: Record<string, any>;
}

interface LegacyMetrics {
  pageViews: number;
  userActions: number;
  errors: number;
  performance: {
    avgLoadTime: number;
    avgResponseTime: number;
  };
}

// ============================================================================
// ENHANCED ANALYTICS SERVICE WRAPPER
// ============================================================================

export class IntegratedAnalyticsService {
  private isEnhancedAvailable = false;
  private fallbackEvents: LegacyAnalyticsEvent[] = [];

  constructor() {
    this.checkEnhancedAvailability();
  }

  // ============================================================================
  // AVAILABILITY CHECK
  // ============================================================================

  private async checkEnhancedAvailability(): Promise<void> {
    try {
      await enhancedAnalyticsService.getHealthStatus();
      this.isEnhancedAvailable = true;
      console.log('Enhanced analytics service is available');
      
      // Process any queued fallback events
      if (this.fallbackEvents.length > 0) {
        await this.processFallbackEvents();
      }
    } catch (error) {
      this.isEnhancedAvailable = false;
      console.warn('Enhanced analytics service not available, using fallback mode');
    }
  }

  private async processFallbackEvents(): Promise<void> {
    try {
      const enhancedEvents = this.fallbackEvents.map(this.convertLegacyToEnhanced);
      await enhancedAnalyticsService.trackBatchEvents(enhancedEvents);
      this.fallbackEvents = [];
      console.log('Processed fallback events with enhanced analytics');
    } catch (error) {
      console.error('Failed to process fallback events:', error);
    }
  }

  // ============================================================================
  // LEGACY COMPATIBILITY METHODS
  // ============================================================================

  /**
   * Legacy method: Track event (backward compatible)
   */
  public async trackEvent(event: string, properties?: Record<string, any>, userId?: string): Promise<void> {
    const legacyEvent: LegacyAnalyticsEvent = {
      event,
      properties,
      userId,
      timestamp: new Date().toISOString()
    };

    if (this.isEnhancedAvailable) {
      try {
        const enhancedEvent = this.convertLegacyToEnhanced(legacyEvent);
        await enhancedAnalyticsService.trackEvent(enhancedEvent);
      } catch (error) {
        console.error('Enhanced tracking failed, using fallback:', error);
        this.fallbackEvents.push(legacyEvent);
      }
    } else {
      this.fallbackEvents.push(legacyEvent);
      this.logFallbackEvent(legacyEvent);
    }
  }

  /**
   * Legacy method: Track page view
   */
  public async trackPageView(page: string, userId?: string, additionalData?: Record<string, any>): Promise<void> {
    return this.trackEvent('page_view', { page, ...additionalData }, userId);
  }

  /**
   * Legacy method: Track user action
   */
  public async trackUserAction(action: string, category: string, userId?: string, value?: number): Promise<void> {
    return this.trackEvent('user_action', { action, category, value }, userId);
  }

  /**
   * Legacy method: Set user data
   */
  public async setUserData(userData: LegacyUserData): Promise<void> {
    if (this.isEnhancedAvailable) {
      try {
        // Convert user data to enhanced event
        const enhancedEvent: EnhancedAnalyticsEvent = {
          event_type: 'USER_ACTION',
          category: 'user_management',
          action: 'user_data_updated',
          user_id: userData.userId,
          data: {
            role: userData.role,
            preferences: userData.preferences
          },
          metadata: {
            source: 'legacy_compatibility'
          }
        };
        
        await enhancedAnalyticsService.trackEvent(enhancedEvent);
      } catch (error) {
        console.error('Failed to track user data update:', error);
      }
    }
  }

  /**
   * Legacy method: Get basic metrics
   */
  public async getMetrics(): Promise<LegacyMetrics> {
    if (this.isEnhancedAvailable) {
      try {
        const realTimeMetrics = await enhancedAnalyticsService.getRealTimeMetrics('1d');
        return this.convertEnhancedToLegacyMetrics(realTimeMetrics);
      } catch (error) {
        console.error('Failed to get enhanced metrics:', error);
      }
    }

    // Fallback metrics
    return {
      pageViews: this.fallbackEvents.filter(e => e.event === 'page_view').length,
      userActions: this.fallbackEvents.filter(e => e.event === 'user_action').length,
      errors: this.fallbackEvents.filter(e => e.event === 'error').length,
      performance: {
        avgLoadTime: 2000,
        avgResponseTime: 500
      }
    };
  }

  // ============================================================================
  // ENHANCED ANALYTICS METHODS (new functionality)
  // ============================================================================

  /**
   * Get real-time metrics with time window
   */
  public async getRealTimeMetrics(window: TimeWindow = '1h'): Promise<RealTimeMetrics | null> {
    if (!this.isEnhancedAvailable) {
      return null;
    }

    try {
      return await enhancedAnalyticsService.getRealTimeMetrics(window);
    } catch (error) {
      console.error('Failed to get real-time metrics:', error);
      return null;
    }
  }

  /**
   * Get UAE-specific analytics dashboard
   */
  public async getUAEDashboard(): Promise<UAEAnalyticsDashboard | null> {
    if (!this.isEnhancedAvailable) {
      return null;
    }

    try {
      return await enhancedAnalyticsService.getUAEDashboard();
    } catch (error) {
      console.error('Failed to get UAE dashboard:', error);
      return null;
    }
  }

  /**
   * Get analytics health status
   */
  public async getHealthStatus(): Promise<AnalyticsHealthStatus | null> {
    if (!this.isEnhancedAvailable) {
      return null;
    }

    try {
      return await enhancedAnalyticsService.getHealthStatus();
    } catch (error) {
      console.error('Failed to get health status:', error);
      return null;
    }
  }

  /**
   * Track enhanced event with full capabilities
   */
  public async trackEnhancedEvent(event: EnhancedAnalyticsEvent): Promise<void> {
    if (this.isEnhancedAvailable) {
      try {
        await enhancedAnalyticsService.trackEvent(event);
      } catch (error) {
        console.error('Enhanced event tracking failed:', error);
        // Convert to legacy format as fallback
        const legacyEvent = this.convertEnhancedToLegacy(event);
        this.fallbackEvents.push(legacyEvent);
      }
    } else {
      const legacyEvent = this.convertEnhancedToLegacy(event);
      this.fallbackEvents.push(legacyEvent);
      this.logFallbackEvent(legacyEvent);
    }
  }

  /**
   * Search events with criteria
   */
  public async searchEvents(query: string, filters?: AnalyticsFilters): Promise<any[] | null> {
    if (!this.isEnhancedAvailable) {
      return null;
    }

    try {
      const searchCriteria = {
        query,
        filters: filters || {},
        page: 1,
        per_page: 50
      };
      
      const result = await enhancedAnalyticsService.searchEvents(searchCriteria);
      return result.data;
    } catch (error) {
      console.error('Failed to search events:', error);
      return null;
    }
  }

  /**
   * Export analytics data
   */
  public async exportData(format: 'csv' | 'excel' | 'json' = 'excel'): Promise<Blob | null> {
    if (!this.isEnhancedAvailable) {
      // Create fallback export
      const data = {
        events: this.fallbackEvents,
        exportDate: new Date().toISOString(),
        format: 'fallback'
      };
      
      return new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
    }

    try {
      return await enhancedAnalyticsService.exportData({
        format,
        include_headers: true,
        date_format: 'YYYY-MM-DD HH:mm:ss',
        language: 'en'
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      return null;
    }
  }

  // ============================================================================
  // CONVERSION METHODS
  // ============================================================================

  private convertLegacyToEnhanced(legacyEvent: LegacyAnalyticsEvent): EnhancedAnalyticsEvent {
    // Map legacy event names to enhanced categories and actions
    const eventMapping: Record<string, { category: string; action: string; event_type: string }> = {
      'page_view': { category: 'navigation', action: 'page_view', event_type: 'USER_ACTION' },
      'user_action': { category: 'user_management', action: 'user_interaction', event_type: 'USER_ACTION' },
      'error': { category: 'system_performance', action: 'error_occurred', event_type: 'ERROR_EVENT' },
      'cv_upload': { category: 'cv_parsing', action: 'file_upload', event_type: 'USER_ACTION' },
      'job_match': { category: 'job_matching', action: 'match_request', event_type: 'USER_ACTION' },
      'profile_update': { category: 'user_management', action: 'profile_updated', event_type: 'USER_ACTION' }
    };

    const mapping = eventMapping[legacyEvent.event] || {
      category: 'user_management',
      action: legacyEvent.event,
      event_type: 'USER_ACTION'
    };

    return {
      event_type: mapping.event_type as any,
      category: mapping.category as any,
      action: mapping.action,
      label: legacyEvent.properties?.label || legacyEvent.event,
      value: legacyEvent.properties?.value,
      user_id: legacyEvent.userId,
      timestamp: legacyEvent.timestamp,
      data: legacyEvent.properties,
      metadata: {
        source: 'legacy_compatibility',
        original_event: legacyEvent.event
      }
    };
  }

  private convertEnhancedToLegacy(enhancedEvent: EnhancedAnalyticsEvent): LegacyAnalyticsEvent {
    return {
      event: `${enhancedEvent.category}_${enhancedEvent.action}`,
      properties: {
        ...enhancedEvent.data,
        label: enhancedEvent.label,
        value: enhancedEvent.value,
        category: enhancedEvent.category,
        action: enhancedEvent.action
      },
      userId: enhancedEvent.user_id,
      timestamp: enhancedEvent.timestamp
    };
  }

  private convertEnhancedToLegacyMetrics(enhancedMetrics: RealTimeMetrics): LegacyMetrics {
    return {
      pageViews: enhancedMetrics.user_engagement.page_views.value,
      userActions: enhancedMetrics.total_events.value,
      errors: enhancedMetrics.error_rate.value * enhancedMetrics.total_events.value / 100,
      performance: {
        avgLoadTime: enhancedMetrics.avg_response_time.value,
        avgResponseTime: enhancedMetrics.avg_response_time.value
      }
    };
  }

  // ============================================================================
  // FALLBACK METHODS
  // ============================================================================

  private logFallbackEvent(event: LegacyAnalyticsEvent): void {
    if (typeof window !== 'undefined' && window.console) {
      console.log('Analytics (Fallback):', event);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if enhanced analytics is available
   */
  public isEnhancedAnalyticsAvailable(): boolean {
    return this.isEnhancedAvailable;
  }

  /**
   * Force refresh of enhanced analytics availability
   */
  public async refreshAvailability(): Promise<boolean> {
    await this.checkEnhancedAvailability();
    return this.isEnhancedAvailable;
  }

  /**
   * Get fallback events count
   */
  public getFallbackEventsCount(): number {
    return this.fallbackEvents.length;
  }

  /**
   * Clear fallback events
   */
  public clearFallbackEvents(): void {
    this.fallbackEvents = [];
  }

  /**
   * Get service status
   */
  public getServiceStatus(): {
    enhanced: boolean;
    fallbackEvents: number;
    lastCheck: string;
  } {
    return {
      enhanced: this.isEnhancedAvailable,
      fallbackEvents: this.fallbackEvents.length,
      lastCheck: new Date().toISOString()
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const integratedAnalyticsService = new IntegratedAnalyticsService();

// ============================================================================
// CONVENIENCE FUNCTIONS (backward compatible)
// ============================================================================

/**
 * Legacy function: Track event
 */
export const trackEvent = (event: string, properties?: Record<string, any>, userId?: string): Promise<void> => {
  return integratedAnalyticsService.trackEvent(event, properties, userId);
};

/**
 * Legacy function: Track page view
 */
export const trackPageView = (page: string, userId?: string, additionalData?: Record<string, any>): Promise<void> => {
  return integratedAnalyticsService.trackPageView(page, userId, additionalData);
};

/**
 * Legacy function: Track user action
 */
export const trackUserAction = (action: string, category: string, userId?: string, value?: number): Promise<void> => {
  return integratedAnalyticsService.trackUserAction(action, category, userId, value);
};

/**
 * Legacy function: Set user data
 */
export const setUserData = (userData: LegacyUserData): Promise<void> => {
  return integratedAnalyticsService.setUserData(userData);
};

/**
 * Legacy function: Get metrics
 */
export const getMetrics = (): Promise<LegacyMetrics> => {
  return integratedAnalyticsService.getMetrics();
};

// ============================================================================
// ENHANCED FUNCTIONS (new functionality)
// ============================================================================

/**
 * Enhanced function: Get real-time metrics
 */
export const getRealTimeMetrics = (window: TimeWindow = '1h'): Promise<RealTimeMetrics | null> => {
  return integratedAnalyticsService.getRealTimeMetrics(window);
};

/**
 * Enhanced function: Get UAE dashboard
 */
export const getUAEDashboard = (): Promise<UAEAnalyticsDashboard | null> => {
  return integratedAnalyticsService.getUAEDashboard();
};

/**
 * Enhanced function: Track enhanced event
 */
export const trackEnhancedEvent = (event: EnhancedAnalyticsEvent): Promise<void> => {
  return integratedAnalyticsService.trackEnhancedEvent(event);
};

/**
 * Enhanced function: Search events
 */
export const searchEvents = (query: string, filters?: AnalyticsFilters): Promise<any[] | null> => {
  return integratedAnalyticsService.searchEvents(query, filters);
};

/**
 * Enhanced function: Export data
 */
export const exportAnalyticsData = (format: 'csv' | 'excel' | 'json' = 'excel'): Promise<Blob | null> => {
  return integratedAnalyticsService.exportData(format);
};

/**
 * Enhanced function: Get health status
 */
export const getAnalyticsHealth = (): Promise<AnalyticsHealthStatus | null> => {
  return integratedAnalyticsService.getHealthStatus();
};

// ============================================================================
// MIGRATION HELPER
// ============================================================================

/**
 * Migration helper: Replace existing analyticsService imports
 * 
 * Usage:
 * 1. Replace: import { analyticsService } from './analyticsService';
 * 2. With: import { integratedAnalyticsService as analyticsService } from './analyticsServiceIntegration';
 * 
 * All existing method calls will continue to work, plus you get enhanced functionality.
 */
export { integratedAnalyticsService as analyticsService };

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  LegacyAnalyticsEvent,
  LegacyUserData,
  LegacyMetrics,
  EnhancedAnalyticsEvent,
  RealTimeMetrics,
  UAEAnalyticsDashboard,
  AnalyticsHealthStatus,
  TimeWindow,
  AnalyticsFilters
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default integratedAnalyticsService;

