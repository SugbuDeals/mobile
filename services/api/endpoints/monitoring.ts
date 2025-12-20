/**
 * Monitoring API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - GET /monitoring/errors (operationId: MonitoringController_getErrorLogs)
 * - GET /monitoring/errors/stats (operationId: MonitoringController_getErrorStats)
 * - GET /monitoring/performance (operationId: MonitoringController_getPerformanceMetrics)
 * - GET /monitoring/performance/stats (operationId: MonitoringController_getPerformanceStats)
 * - GET /monitoring/dashboard (operationId: MonitoringController_getDashboardStats)
 */

import { getApiClient } from "../client";

export type TimeRange = "hour" | "day" | "week" | "month";

export interface MonitoringParams {
  timeRange?: TimeRange;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  endpoint?: string;
  method?: string;
  level?: "error" | "warn" | "debug";
}

export interface ErrorLogResponseDto {
  id: number;
  level: string;
  message: string;
  stack?: string;
  endpoint?: string;
  method?: string;
  userId?: number;
  statusCode?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PerformanceMetricResponseDto {
  id: number;
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userId?: number;
  createdAt: string;
}

export interface ErrorStatsDto {
  totalErrors: number;
  totalWarnings: number;
  errorsLast24h: number;
  warningsLast24h: number;
  topErrorEndpoints: string[];
  errorsByStatusCode: Record<string, number>;
}

export interface PerformanceStatsDto {
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  totalRequests: number;
  slowestEndpoints: string[];
  requestsByStatusCode: Record<string, number>;
}

export interface DashboardStatsDto {
  errors: ErrorStatsDto;
  performance: PerformanceStatsDto;
  generatedAt: string;
}

export type TestPerformanceRoute =
  | "auth/login"
  | "auth/register"
  | "user"
  | "product"
  | "store"
  | "promotion"
  | "category"
  | "bookmark"
  | "view"
  | "ai/chat"
  | "subscription"
  | "notification"
  | "file"
  | "all";

export interface RouteStatDto {
  endpoint: string;
  method: string;
  count: number;
  firstSeen: number;
  lastUsed: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  statusCodes: Record<string, number>;
  errorCount: number;
}

export interface RouteSummaryDto {
  totalRequests: number;
  totalErrors: number;
  uniqueRoutes: number;
  avgResponseTime: number;
  mostUsedRoutes: Array<Record<string, unknown>>;
  slowestRoutes: Array<Record<string, unknown>>;
  errorRoutes: Array<Record<string, unknown>>;
  timestamp: string;
}

export interface TestPerformanceResponseDto {
  message: string;
  simulatedResponseTime: number;
  timestamp: string;
  userId: number;
}

export interface TestErrorResponseDto {
  message: string;
  statusCode: number;
  test: boolean;
  userId: number;
  timestamp: string;
}

export const monitoringApi = {
  /**
   * Get error logs (Admin only)
   * Retrieves error logs with optional filtering by time range, endpoint, and method. Supports pagination.
   * Operation: MonitoringController_getErrorLogs
   * Endpoint: GET /monitoring/errors
   */
  getErrorLogs: (params?: MonitoringParams): Promise<ErrorLogResponseDto[]> => {
    return getApiClient().get<ErrorLogResponseDto[]>("/monitoring/errors", {
      params,
    });
  },

  /**
   * Get error statistics (Admin only)
   * Returns aggregated error statistics including counts, top error endpoints, and errors by status code.
   * Operation: MonitoringController_getErrorStats
   * Endpoint: GET /monitoring/errors/stats
   */
  getErrorStats: (params?: Omit<MonitoringParams, "page" | "limit" | "endpoint" | "method">): Promise<ErrorStatsDto> => {
    return getApiClient().get<ErrorStatsDto>("/monitoring/errors/stats", {
      params,
    });
  },

  /**
   * Get performance metrics (Admin only)
   * Retrieves performance metrics with optional filtering by time range, endpoint, and method. Supports pagination.
   * Operation: MonitoringController_getPerformanceMetrics
   * Endpoint: GET /monitoring/performance
   */
  getPerformanceMetrics: (params?: MonitoringParams): Promise<PerformanceMetricResponseDto[]> => {
    return getApiClient().get<PerformanceMetricResponseDto[]>("/monitoring/performance", {
      params,
    });
  },

  /**
   * Get performance statistics (Admin only)
   * Returns aggregated performance statistics including average response times, slowest endpoints, and request counts by status code.
   * Operation: MonitoringController_getPerformanceStats
   * Endpoint: GET /monitoring/performance/stats
   */
  getPerformanceStats: (params?: Omit<MonitoringParams, "page" | "limit" | "endpoint" | "method">): Promise<PerformanceStatsDto> => {
    return getApiClient().get<PerformanceStatsDto>("/monitoring/performance/stats", {
      params,
    });
  },

  /**
   * Get dashboard statistics (Admin only)
   * Returns combined error and performance statistics for the admin dashboard. Provides a comprehensive overview of system health.
   * Operation: MonitoringController_getDashboardStats
   * Endpoint: GET /monitoring/dashboard
   */
  getDashboardStats: (params?: Omit<MonitoringParams, "page" | "limit" | "endpoint" | "method" | "level">): Promise<DashboardStatsDto> => {
    return getApiClient().get<DashboardStatsDto>("/monitoring/dashboard", {
      params,
    });
  },

  /**
   * Test performance monitoring (Admin only)
   * Generates test performance metrics with various response times. Useful for testing the monitoring system.
   * Operation: MonitoringController_testPerformance
   * Endpoint: POST /monitoring/test/performance
   */
  testPerformance: (responseTime?: number, route?: TestPerformanceRoute): Promise<TestPerformanceResponseDto> => {
    const params: string[] = [];
    if (responseTime !== undefined) params.push(`responseTime=${responseTime}`);
    if (route) params.push(`route=${route}`);
    const queryString = params.length > 0 ? `?${params.join("&")}` : "";
    return getApiClient().post<TestPerformanceResponseDto>(`/monitoring/test/performance${queryString}`);
  },

  /**
   * Test error monitoring (Admin only)
   * Generates a test error to verify error tracking. The error will be logged to the monitoring system.
   * Operation: MonitoringController_testError
   * Endpoint: POST /monitoring/test/error
   */
  testError: (statusCode?: number, errorType?: "error" | "warn" | "all"): Promise<TestErrorResponseDto> => {
    const params: string[] = [];
    if (statusCode !== undefined) params.push(`statusCode=${statusCode}`);
    if (errorType) params.push(`errorType=${errorType}`);
    const queryString = params.length > 0 ? `?${params.join("&")}` : "";
    return getApiClient().post<TestErrorResponseDto>(`/monitoring/test/error${queryString}`);
  },

  /**
   * Test 401 Unauthorized error tracking (Admin only)
   * Generates a 401 Unauthorized error to test authentication error tracking.
   * Operation: MonitoringController_testUnauthorized
   * Endpoint: POST /monitoring/test/unauthorized
   */
  testUnauthorized: (): Promise<TestErrorResponseDto> => {
    return getApiClient().post<TestErrorResponseDto>("/monitoring/test/unauthorized");
  },

  /**
   * Test 400 Bad Request error tracking (Admin only)
   * Endpoint: POST /monitoring/test/bad-request
   */
  testBadRequest: (): Promise<TestErrorResponseDto> => {
    return getApiClient().post<TestErrorResponseDto>("/monitoring/test/bad-request");
  },

  /**
   * Test 403 Forbidden error tracking (Admin only)
   * Endpoint: POST /monitoring/test/forbidden
   */
  testForbidden: (): Promise<TestErrorResponseDto> => {
    return getApiClient().post<TestErrorResponseDto>("/monitoring/test/forbidden");
  },

  /**
   * Test 404 Not Found error tracking (Admin only)
   * Endpoint: POST /monitoring/test/not-found
   */
  testNotFound: (): Promise<TestErrorResponseDto> => {
    return getApiClient().post<TestErrorResponseDto>("/monitoring/test/not-found");
  },

  /**
   * Test 409 Conflict error tracking (Admin only)
   * Endpoint: POST /monitoring/test/conflict
   */
  testConflict: (): Promise<TestErrorResponseDto> => {
    return getApiClient().post<TestErrorResponseDto>("/monitoring/test/conflict");
  },

  /**
   * Test 422 Unprocessable Entity error tracking (Admin only)
   * Endpoint: POST /monitoring/test/unprocessable
   */
  testUnprocessable: (): Promise<TestErrorResponseDto> => {
    return getApiClient().post<TestErrorResponseDto>("/monitoring/test/unprocessable");
  },

  /**
   * Test 502 Bad Gateway error tracking (Admin only)
   * Endpoint: POST /monitoring/test/bad-gateway
   */
  testBadGateway: (): Promise<TestErrorResponseDto> => {
    return getApiClient().post<TestErrorResponseDto>("/monitoring/test/bad-gateway");
  },

  /**
   * Test 503 Service Unavailable error tracking (Admin only)
   * Endpoint: POST /monitoring/test/service-unavailable
   */
  testServiceUnavailable: (): Promise<TestErrorResponseDto> => {
    return getApiClient().post<TestErrorResponseDto>("/monitoring/test/service-unavailable");
  },

  /**
   * Get live route monitoring data (Admin only)
   * Endpoint: GET /monitoring/routes/live
   */
  getLiveRoutes: (): Promise<RouteStatDto[]> => {
    return getApiClient().get<RouteStatDto[]>("/monitoring/routes/live");
  },

  /**
   * Get route monitoring summary (Admin only)
   * Endpoint: GET /monitoring/routes/summary
   */
  getRouteSummary: (): Promise<RouteSummaryDto> => {
    return getApiClient().get<RouteSummaryDto>("/monitoring/routes/summary");
  },

  /**
   * Get statistics for a specific route (Admin only)
   * Endpoint: GET /monitoring/routes/{endpoint}
   */
  getRouteStat: (endpoint: string, method?: string): Promise<RouteStatDto> => {
    return getApiClient().get<RouteStatDto>(`/monitoring/routes/${encodeURIComponent(endpoint)}`, {
      params: method ? { method } : undefined,
    });
  },

  /**
   * Clear route statistics (Admin only)
   * Endpoint: POST /monitoring/routes/clear
   */
  clearRouteStats: (): Promise<void> => {
    return getApiClient().post<void>("/monitoring/routes/clear");
  },
};
