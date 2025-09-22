/**
 * Search Analytics Service
 * Tracks search and filter performance to monitor API call reduction and user experience
 */

export interface SearchMetric {
  id: string;
  timestamp: number;
  searchTerm: string;
  component: string;
  responseTime: number;
  resultCount: number;
  fromCache: boolean;
  userId?: string;
}

export interface FilterMetric {
  id: string;
  timestamp: number;
  component: string;
  filterChanges: number;
  batchSize: number;
  debounceTime: number;
  userId?: string;
}

export interface PerformanceReport {
  totalSearches: number;
  cacheHitRate: number;
  averageResponseTime: number;
  totalFilterChanges: number;
  averageBatchSize: number;
  apiCallsReduced: number;
  timeRange: {
    start: number;
    end: number;
  };
}

class SearchAnalyticsService {
  private searchMetrics: SearchMetric[] = [];
  private filterMetrics: FilterMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics in memory

  /**
   * Track a search operation
   */
  trackSearch(metric: Omit<SearchMetric, 'id' | 'timestamp'>): void {
    const searchMetric: SearchMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: Date.now()
    };

    this.searchMetrics.push(searchMetric);
    this.trimMetrics();

    // Log performance insights in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Search Analytics: ${metric.component} - ${metric.searchTerm} (${metric.responseTime}ms, cache: ${metric.fromCache})`);
    }
  }

  /**
   * Track filter changes
   */
  trackFilter(metric: Omit<FilterMetric, 'id' | 'timestamp'>): void {
    const filterMetric: FilterMetric = {
      ...metric,
      id: this.generateId(),
      timestamp: Date.now()
    };

    this.filterMetrics.push(filterMetric);
    this.trimMetrics();

    // Log filter batching efficiency
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Filter Analytics: ${metric.component} - Batch ${metric.batchSize} changes (${metric.debounceTime}ms debounce)`);
    }
  }

  /**
   * Get performance report for a time range
   */
  getPerformanceReport(hours: number = 24): PerformanceReport {
    const now = Date.now();
    const startTime = now - (hours * 60 * 60 * 1000);

    const recentSearches = this.searchMetrics.filter(m => m.timestamp >= startTime);
    const recentFilters = this.filterMetrics.filter(m => m.timestamp >= startTime);

    const cacheHits = recentSearches.filter(s => s.fromCache).length;
    const totalResponseTime = recentSearches.reduce((sum, s) => sum + s.responseTime, 0);
    const totalBatchSize = recentFilters.reduce((sum, f) => sum + f.batchSize, 0);

    // Estimate API calls reduced by debouncing (assume 3x reduction)
    const estimatedApiCallsReduced = recentFilters.reduce((sum, f) => {
      return sum + Math.max(0, f.filterChanges - Math.ceil(f.filterChanges / 3));
    }, 0);

    return {
      totalSearches: recentSearches.length,
      cacheHitRate: recentSearches.length > 0 ? cacheHits / recentSearches.length : 0,
      averageResponseTime: recentSearches.length > 0 ? totalResponseTime / recentSearches.length : 0,
      totalFilterChanges: recentFilters.reduce((sum, f) => sum + f.filterChanges, 0),
      averageBatchSize: recentFilters.length > 0 ? totalBatchSize / recentFilters.length : 0,
      apiCallsReduced: estimatedApiCallsReduced,
      timeRange: {
        start: startTime,
        end: now
      }
    };
  }

  /**
   * Get popular search terms
   */
  getPopularSearchTerms(limit: number = 10): Array<{ term: string; count: number }> {
    const termCounts = this.searchMetrics.reduce((acc, metric) => {
      const term = metric.searchTerm.toLowerCase().trim();
      if (term) {
        acc[term] = (acc[term] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(termCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([term, count]) => ({ term, count }));
  }

  /**
   * Get component usage statistics
   */
  getComponentStats(): Array<{ component: string; searches: number; filters: number }> {
    const componentStats: Record<string, { searches: number; filters: number }> = {};

    this.searchMetrics.forEach(metric => {
      if (!componentStats[metric.component]) {
        componentStats[metric.component] = { searches: 0, filters: 0 };
      }
      componentStats[metric.component].searches++;
    });

    this.filterMetrics.forEach(metric => {
      if (!componentStats[metric.component]) {
        componentStats[metric.component] = { searches: 0, filters: 0 };
      }
      componentStats[metric.component].filters++;
    });

    return Object.entries(componentStats).map(([component, stats]) => ({
      component,
      ...stats
    }));
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.searchMetrics = [];
    this.filterMetrics = [];
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): { searches: SearchMetric[]; filters: FilterMetric[] } {
    return {
      searches: [...this.searchMetrics],
      filters: [...this.filterMetrics]
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private trimMetrics(): void {
    if (this.searchMetrics.length > this.maxMetrics) {
      this.searchMetrics = this.searchMetrics.slice(-this.maxMetrics);
    }
    if (this.filterMetrics.length > this.maxMetrics) {
      this.filterMetrics = this.filterMetrics.slice(-this.maxMetrics);
    }
  }
}

// Singleton instance
export const searchAnalytics = new SearchAnalyticsService();

/**
 * React hook for search analytics
 */
export const useSearchAnalytics = (componentName: string) => {
  const trackSearch = (searchTerm: string, responseTime: number, resultCount: number, fromCache: boolean = false) => {
    searchAnalytics.trackSearch({
      searchTerm,
      component: componentName,
      responseTime,
      resultCount,
      fromCache
    });
  };

  const trackFilter = (filterChanges: number, batchSize: number, debounceTime: number) => {
    searchAnalytics.trackFilter({
      component: componentName,
      filterChanges,
      batchSize,
      debounceTime
    });
  };

  return { trackSearch, trackFilter };
};
