/**
 * Performance Optimization Service
 * Provides utilities and services for monitoring and improving application performance
 */

export interface PerformanceMetrics {
  queryTime: number;
  recordCount: number;
  cacheHit: boolean;
  optimizationUsed: string;
}

export interface QueryPerformanceReport {
  service: string;
  method: string;
  metrics: PerformanceMetrics;
  timestamp: string;
  improvements?: string[];
}

/**
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static reports: QueryPerformanceReport[] = [];
  
  static async measureQuery<T>(
    service: string,
    method: string,
    queryFn: () => Promise<T>,
    optimization?: string
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    const startTime = performance.now();
    
    try {
      const result = await queryFn();
      const endTime = performance.now();
      
      const metrics: PerformanceMetrics = {
        queryTime: endTime - startTime,
        recordCount: Array.isArray(result) ? result.length : 1,
        cacheHit: false, // Could be enhanced to detect cache hits
        optimizationUsed: optimization || 'none'
      };
      
      // Store performance report
      this.reports.push({
        service,
        method,
        metrics,
        timestamp: new Date().toISOString(),
        improvements: this.generateImprovementSuggestions(metrics)
      });
      
      // Keep only last 100 reports
      if (this.reports.length > 100) {
        this.reports.shift();
      }
      
      return { result, metrics };
    } catch (error) {
      const endTime = performance.now();
      
      // Log failed query performance
      this.reports.push({
        service,
        method,
        metrics: {
          queryTime: endTime - startTime,
          recordCount: 0,
          cacheHit: false,
          optimizationUsed: optimization || 'none'
        },
        timestamp: new Date().toISOString(),
        improvements: ['Query failed - check error handling']
      });
      
      throw error;
    }
  }
  
  private static generateImprovementSuggestions(metrics: PerformanceMetrics): string[] {
    const suggestions: string[] = [];
    
    if (metrics.queryTime > 1000) {
      suggestions.push('Query time > 1s - Consider adding database indexes');
    }
    
    if (metrics.recordCount > 100 && metrics.optimizationUsed === 'none') {
      suggestions.push('Large result set without optimization - Consider using RPC functions');
    }
    
    if (!metrics.cacheHit && metrics.recordCount > 10) {
      suggestions.push('Consider implementing caching for this query');
    }
    
    return suggestions;
  }
  
  static getPerformanceReports(): QueryPerformanceReport[] {
    return [...this.reports];
  }
  
  static getSlowQueries(threshold: number = 500): QueryPerformanceReport[] {
    return this.reports.filter(report => report.metrics.queryTime > threshold);
  }
  
  static getAverageQueryTime(service?: string, method?: string): number {
    let relevantReports = this.reports;
    
    if (service) {
      relevantReports = relevantReports.filter(r => r.service === service);
    }
    
    if (method) {
      relevantReports = relevantReports.filter(r => r.method === method);
    }
    
    if (relevantReports.length === 0) return 0;
    
    const totalTime = relevantReports.reduce((sum, report) => sum + report.metrics.queryTime, 0);
    return totalTime / relevantReports.length;
  }
}

/**
 * Wrapper function for optimized service calls
 */
export async function withPerformanceMonitoring<T>(
  service: string,
  method: string,
  queryFn: () => Promise<T>,
  optimization?: string
): Promise<T> {
  const { result } = await PerformanceMonitor.measureQuery(service, method, queryFn, optimization);
  return result;
}

/**
 * Cache utility for query results
 */
export class QueryCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  static set(key: string, data: any, ttlMs: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }
  
  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }
  
  static clear(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }
    
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(keyPattern)
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
  
  static getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Cached wrapper for expensive queries
 */
export async function withCaching<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlMs: number = 300000
): Promise<T> {
  // Try to get from cache first
  const cached = QueryCache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Execute query and cache result
  const result = await queryFn();
  QueryCache.set(cacheKey, result, ttlMs);
  
  return result;
}

/**
 * Performance benchmarking utilities
 */
export class PerformanceBenchmark {
  static async compareImplementations<T>(
    name: string,
    implementations: Array<{ name: string; fn: () => Promise<T> }>,
    iterations: number = 5
  ): Promise<Array<{ name: string; averageTime: number; results: T }>> {
    const results: Array<{ name: string; averageTime: number; results: T }> = [];
    
    for (const impl of implementations) {
      const times: number[] = [];
      let lastResult: T;
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        lastResult = await impl.fn();
        const endTime = performance.now();
        times.push(endTime - startTime);
      }
      
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      results.push({
        name: impl.name,
        averageTime,
        results: lastResult!
      });
    }
    
    console.group(`Performance Benchmark: ${name}`);
    results
      .sort((a, b) => a.averageTime - b.averageTime)
      .forEach((result, index) => {
        const status = index === 0 ? '🥇 FASTEST' : index === 1 ? '🥈' : '🥉';
        console.log(`${status} ${result.name}: ${result.averageTime.toFixed(2)}ms avg`);
      });
    console.groupEnd();
    
    return results;
  }
}
