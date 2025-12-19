/**
 * Error Tracking and Performance Monitoring Utilities
 * Provides centralized error logging and performance tracking
 */

interface ErrorContext {
  endpoint?: string;
  method?: string;
  statusCode?: number;
  userId?: number;
  userRole?: string;
  timestamp?: string;
  userAgent?: string;
  additionalData?: Record<string, unknown>;
}

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: string;
  success: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Log error with context for monitoring
 */
export function logError(
  error: Error | unknown,
  context?: ErrorContext
): void {
  // Extract error message from various error types
  let errorMessage: string;
  let errorStack: string | undefined;
  
  if (error instanceof Error) {
    errorMessage = error.message;
    errorStack = error.stack;
  } else if (error && typeof error === 'object' && 'message' in error) {
    // Handle ApiError and similar objects with message property
    errorMessage = String((error as { message: unknown }).message);
    errorStack = 'stack' in error ? String((error as { stack: unknown }).stack) : undefined;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    // For other types, try to stringify or use a default message
    try {
      errorMessage = JSON.stringify(error);
    } catch {
      errorMessage = 'Unknown error occurred';
    }
  }

  const errorLog = {
    message: errorMessage,
    stack: errorStack,
    context: {
      ...context,
      timestamp: new Date().toISOString(),
    },
  };

  // Log to console in development
  

  // In production, you could send to error tracking service (Sentry, LogRocket, etc.)
  // Example:
  // if (!__DEV__) {
  //   Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Track performance metrics
 */
export function trackPerformance(metric: PerformanceMetric): void {
  // Log to console in development
  if (__DEV__) {
    const durationColor = metric.duration > 1000 ? "🔴" : metric.duration > 500 ? "🟡" : "🟢";
    console.log(
      `[Performance] ${durationColor} ${metric.operation}: ${metric.duration}ms`,
      metric.metadata || ""
    );
  }

  // In production, you could send to analytics service
  // Example:
  // if (!__DEV__) {
  //   Analytics.track("performance_metric", metric);
  // }
}

/**
 * Measure async operation performance
 */
export async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = performance.now();
  let success = true;

  try {
    const result = await fn();
    return result;
  } catch (error) {
    success = false;
    logError(error, {
      endpoint: operation,
      additionalData: metadata,
    });
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    trackPerformance({
      operation,
      duration,
      timestamp: new Date().toISOString(),
      success,
      metadata,
    });
  }
}

/**
 * Track API request performance
 */
export function trackApiRequest(
  endpoint: string,
  method: string,
  duration: number,
  statusCode: number,
  success: boolean
): void {
  trackPerformance({
    operation: `API ${method} ${endpoint}`,
    duration,
    timestamp: new Date().toISOString(),
    success,
    metadata: {
      endpoint,
      method,
      statusCode,
    },
  });

  // Log slow requests
  if (duration > 2000) {
    logError(new Error(`Slow API request: ${method} ${endpoint} took ${duration}ms`), {
      endpoint,
      method,
      statusCode,
      additionalData: {
        duration,
        isSlowRequest: true,
      },
    });
  }
}

/**
 * Track user action performance
 */
export function trackUserAction(
  action: string,
  duration: number,
  success: boolean,
  metadata?: Record<string, unknown>
): void {
  trackPerformance({
    operation: `User Action: ${action}`,
    duration,
    timestamp: new Date().toISOString(),
    success,
    metadata,
  });
}

/**
 * Monitor app health metrics
 */
export interface AppHealthMetrics {
  apiResponseTime: number;
  errorRate: number;
  activeUsers?: number;
  memoryUsage?: number;
}

export function reportAppHealth(metrics: AppHealthMetrics): void {
  if (__DEV__) {
    console.log("[App Health]", metrics);
  }

  // In production, send to monitoring service
  // Example:
  // if (!__DEV__) {
  //   MonitoringService.reportHealth(metrics);
  // }
}

