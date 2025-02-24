import * as Sentry from '@sentry/nextjs';

interface PerformanceMetrics {
  duration: number;
  startTime: number;
  endTime: number;
  success: boolean;
}

class MonitoringService {
  constructor() {
    if (!Sentry.getCurrentHub().getClient()) {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        tracesSampleRate: 1.0,
        integrations: [
          new Sentry.BrowserTracing({
            tracePropagationTargets: ['localhost', /^https:\/\/[^/]*\.qc-analyzer\.com/],
          }),
        ],
        environment: process.env.NODE_ENV,
      });
    }
  }

  /**
   * Track performance of PDF analysis operations
   */
  trackAnalysisPerformance(
    fileHash: string,
    operation: string,
    metrics: PerformanceMetrics
  ): void {
    const transaction = Sentry.startTransaction({
      name: `pdf.analysis.${operation}`,
      op: 'pdf.analysis',
    });

    Sentry.setContext('pdf', {
      fileHash,
      operation,
      ...metrics,
    });

    transaction.setMeasurement('duration', metrics.duration, 'millisecond');
    transaction.setStatus(metrics.success ? 'ok' : 'failed');
    transaction.finish();
  }

  /**
   * Track cache performance
   */
  trackCachePerformance(operation: string, hit: boolean, duration: number): void {
    const transaction = Sentry.startTransaction({
      name: `cache.${operation}`,
      op: 'cache',
    });

    Sentry.setContext('cache', {
      operation,
      hit,
      duration,
    });

    transaction.setMeasurement('duration', duration, 'millisecond');
    transaction.setStatus('ok');
    transaction.finish();
  }

  /**
   * Track worker performance
   */
  trackWorkerPerformance(
    operation: string,
    metrics: PerformanceMetrics
  ): void {
    const transaction = Sentry.startTransaction({
      name: `worker.${operation}`,
      op: 'worker',
    });

    Sentry.setContext('worker', {
      operation,
      ...metrics,
    });

    transaction.setMeasurement('duration', metrics.duration, 'millisecond');
    transaction.setStatus(metrics.success ? 'ok' : 'failed');
    transaction.finish();
  }

  /**
   * Track API endpoint performance
   */
  trackAPIPerformance(
    endpoint: string,
    method: string,
    metrics: PerformanceMetrics
  ): void {
    const transaction = Sentry.startTransaction({
      name: `api.${method}.${endpoint}`,
      op: 'api',
    });

    Sentry.setContext('api', {
      endpoint,
      method,
      ...metrics,
    });

    transaction.setMeasurement('duration', metrics.duration, 'millisecond');
    transaction.setStatus(metrics.success ? 'ok' : 'failed');
    transaction.finish();
  }

  /**
   * Track memory usage
   */
  trackMemoryUsage(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const memory = (window.performance as any).memory;
      if (memory) {
        Sentry.setContext('memory', {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    }
  }

  /**
   * Report error with context
   */
  reportError(error: Error, context?: Record<string, any>): void {
    if (context) {
      Sentry.setContext('error_context', context);
    }
    Sentry.captureException(error);
  }

  /**
   * Add breadcrumb for debugging
   */
  addBreadcrumb(
    message: string,
    category: string,
    level: Sentry.SeverityLevel = 'info'
  ): void {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
    });
  }

  /**
   * Set user context
   */
  setUser(id: string, email?: string, username?: string): void {
    Sentry.setUser({
      id,
      email,
      username,
    });
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    Sentry.setUser(null);
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService(); 