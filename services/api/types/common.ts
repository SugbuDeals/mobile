/**
 * Common API types and interfaces
 * Aligned with server.json OpenAPI specification
 */

export interface ApiError {
  message: string;
  statusCode?: number;
  status?: number;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  skip?: number;
  take?: number;
}

/**
 * Query parameters matching server.json pagination patterns
 * Uses skip/take pattern as per Swagger specification
 */
export interface QueryParams {
  skip?: number;
  take?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Error response structure matching server.json error schemas
 * Example: { statusCode: 400, message: "Invalid user id" }
 * or: { statusCode: 400, message: ["email must be an email", "password must be longer than or equal to 6 characters"] }
 */
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

