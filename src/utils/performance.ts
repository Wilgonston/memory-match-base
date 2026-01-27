/**
 * Performance Monitoring Utilities
 * 
 * Provides performance tracking and monitoring for the application.
 * 
 * Requirements: 24.1, 24.2, 24.3
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    avgLoadTime: number;
    avgTransactionTime: number;
    avgRenderTime: number;
    errorCount: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private marks: Map<string, number> = new Map();
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  
  /**
   * Start measuring a performance metric
   */
  startMeasure(name: string): void {
    this.marks.set(name, performance.now());
  }
  
  /**
   * End measuring and record the metric
   */
  endMeasure(name: string, metadata?: Record<string, unknown>): number {
    const startTime = this.marks.get(name);
    if (startTime === undefined) {
      console.warn(`Performance measure "${name}" was not started`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.marks.delete(name);
    
    this.recordMetric({
      name,
      value: duration,
      timestamp: Date.now(),
      metadata,
    });
    
    return duration;
  }
  
  /**
   * Record a metric directly
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only the last maxMetrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get metrics by name
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }
  
  /**
   * Get average value for a metric
   */
  getAverage(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }
  
  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    return {
      metrics: this.getMetrics(),
      summary: {
        avgLoadTime: this.getAverage('page-load'),
        avgTransactionTime: this.getAverage('transaction'),
        avgRenderTime: this.getAverage('render'),
        errorCount: this.getMetrics('error').length,
      },
    };
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.marks.clear();
  }
  
  /**
   * Log performance report to console
   */
  logReport(): void {
    const report = this.getReport();
    console.group('Performance Report');
    console.table(report.summary);
    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure component render time
 */
export function measureRender(componentName: string): () => void {
  const measureName = `render-${componentName}`;
  performanceMonitor.startMeasure(measureName);
  
  return () => {
    performanceMonitor.endMeasure(measureName, { component: componentName });
  };
}

/**
 * Measure async operation
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  performanceMonitor.startMeasure(name);
  try {
    const result = await operation();
    performanceMonitor.endMeasure(name, metadata);
    return result;
  } catch (error) {
    performanceMonitor.endMeasure(name, { ...metadata, error: true });
    throw error;
  }
}

/**
 * Track Web Vitals
 */
export function trackWebVitals(): void {
  if (typeof window === 'undefined') return;
  
  // Track First Contentful Paint
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
        performanceMonitor.recordMetric({
          name: 'fcp',
          value: entry.startTime,
          timestamp: Date.now(),
        });
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['paint'] });
  } catch (e) {
    // PerformanceObserver not supported
  }
  
  // Track Largest Contentful Paint
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    performanceMonitor.recordMetric({
      name: 'lcp',
      value: lastEntry.startTime,
      timestamp: Date.now(),
    });
  });
  
  try {
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // PerformanceObserver not supported
  }
}

/**
 * Monitor memory usage (if available)
 */
export function getMemoryUsage(): { used: number; total: number } | null {
  if (typeof window === 'undefined' || !(performance as any).memory) {
    return null;
  }
  
  const memory = (performance as any).memory;
  return {
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
  };
}
