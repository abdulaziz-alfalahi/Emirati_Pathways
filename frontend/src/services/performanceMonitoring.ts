/**
 * Performance Monitoring Service
 * Tracks Core Web Vitals and application performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
}

interface WebVitalsMetric extends PerformanceMetric {
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitalsMetric[] = [];
  private isEnabled = true;

  /**
   * Initialize performance monitoring
   */
  init() {
    if (typeof window === 'undefined' || !this.isEnabled) return;

    // Monitor Core Web Vitals using the web-vitals library pattern
    this.observeWebVitals();
    
    // Monitor custom performance metrics
    this.observeCustomMetrics();
    
    // Monitor resource loading
    this.observeResourceLoading();
  }

  /**
   * Track Core Web Vitals
   */
  private observeWebVitals() {
    // CLS - Cumulative Layout Shift
    this.observeCLS();
    
    // FID - First Input Delay
    this.observeFID();
    
    // LCP - Largest Contentful Paint
    this.observeLCP();
    
    // FCP - First Contentful Paint
    this.observeFCP();
    
    // TTFB - Time to First Byte
    this.observeTTFB();
  }

  private observeCLS() {
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          const firstSessionEntry = sessionEntries[0];
          const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

          if (sessionValue && 
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000) {
            sessionValue += (entry as any).value;
            sessionEntries.push(entry);
          } else {
            sessionValue = (entry as any).value;
            sessionEntries = [entry];
          }

          if (sessionValue > clsValue) {
            clsValue = sessionValue;
            this.reportWebVital('CLS', clsValue);
          }
        }
      }
    });

    observer.observe({ type: 'layout-shift', buffered: true });
  }

  private observeFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.reportWebVital('FID', (entry as any).processingStart - entry.startTime);
      }
    });

    observer.observe({ type: 'first-input', buffered: true });
  }

  private observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.reportWebVital('LCP', lastEntry.startTime);
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
  }

  private observeFCP() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.reportWebVital('FCP', entry.startTime);
        }
      }
    });

    observer.observe({ type: 'paint', buffered: true });
  }

  private observeTTFB() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      this.reportWebVital('TTFB', ttfb);
    }
  }

  /**
   * Report Web Vital metric
   */
  private reportWebVital(name: string, value: number) {
    const metric: WebVitalsMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      id: this.generateId(),
      delta: value,
      rating: this.getRating(name, value)
    };

    this.webVitals.push(metric);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${name}: ${value.toFixed(2)}ms (${metric.rating})`);
    }
  }

  /**
   * Get performance rating based on thresholds
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: [0.1, 0.25],
      FID: [100, 300],
      LCP: [2500, 4000],
      FCP: [1800, 3000],
      TTFB: [800, 1800]
    };

    const [good, poor] = thresholds[name as keyof typeof thresholds] || [0, Infinity];
    
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Monitor custom performance metrics
   */
  private observeCustomMetrics() {
    // Monitor route changes
    this.trackRoutePerformance();
    
    // Monitor component render times
    this.trackComponentPerformance();
  }

  /**
   * Track route change performance
   */
  trackRoutePerformance() {
    const startTime = performance.now();
    
    // This would be called when route changes
    window.addEventListener('popstate', () => {
      const endTime = performance.now();
      this.reportMetric('route-change', endTime - startTime);
    });
  }

  /**
   * Track component performance
   */
  trackComponentPerformance() {
    // This could be enhanced with React DevTools integration
    // For now, we'll track generic component operations
  }

  /**
   * Monitor resource loading
   */
  private observeResourceLoading() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          this.reportMetric(`resource-${this.getResourceType(resource.name)}`, resource.duration);
        }
      }
    });

    observer.observe({ type: 'resource', buffered: true });
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  /**
   * Report custom metric
   */
  reportMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href
    };

    this.metrics.push(metric);
    
    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const summary = {
      webVitals: this.getWebVitalsSummary(),
      customMetrics: this.getCustomMetricsSummary(),
      resourceLoading: this.getResourceLoadingSummary()
    };

    return summary;
  }

  private getWebVitalsSummary() {
    const vitals = ['CLS', 'FID', 'LCP', 'FCP', 'TTFB'];
    return vitals.reduce((acc, vital) => {
      const metrics = this.webVitals.filter(m => m.name === vital);
      if (metrics.length > 0) {
        const latest = metrics[metrics.length - 1];
        acc[vital] = {
          value: latest.value,
          rating: latest.rating,
          timestamp: latest.timestamp
        };
      }
      return acc;
    }, {} as Record<string, any>);
  }

  private getCustomMetricsSummary() {
    // Group metrics by name and calculate averages
    const groups = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(groups).reduce((acc, [name, values]) => {
      acc[name] = {
        average: values.reduce((sum, val) => sum + val, 0) / values.length,
        count: values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
      return acc;
    }, {} as Record<string, any>);
  }

  private getResourceLoadingSummary() {
    const resourceMetrics = this.metrics.filter(m => m.name.startsWith('resource-'));
    const types = ['script', 'stylesheet', 'image', 'font', 'other'];
    
    return types.reduce((acc, type) => {
      const typeMetrics = resourceMetrics.filter(m => m.name === `resource-${type}`);
      if (typeMetrics.length > 0) {
        const times = typeMetrics.map(m => m.value);
        acc[type] = {
          count: times.length,
          average: times.reduce((sum, val) => sum + val, 0) / times.length,
          total: times.reduce((sum, val) => sum + val, 0)
        };
      }
      return acc;
    }, {} as Record<string, any>);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = [];
    this.webVitals = [];
  }
}

export const performanceMonitoring = new PerformanceMonitoringService();
