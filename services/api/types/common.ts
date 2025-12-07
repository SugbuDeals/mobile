/**
 * Common API types and interfaces
 */

export interface ApiError {
  message: string;
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

export interface QueryParams {
  skip?: number;
  take?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

