/**
 * Base API client with authentication and error handling
 */

import env from "@/config/env";
import { ApiError, ApiResponse } from "./types/common";

export interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
}

export interface ApiClientConfig {
  baseURL: string;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}

class ApiClient {
  private baseURL: string;
  private getAccessToken?: () => string | null;
  private onUnauthorized?: () => void;

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL;
    this.getAccessToken = config.getAccessToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = this.getAccessToken?.();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Build query string from params
   */
  private buildQueryString(params?: Record<string, unknown>): string {
    if (!params) return "";
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  /**
   * Handle API errors
   */
  private async handleError(
    response: Response,
    skipErrorHandling?: boolean
  ): Promise<ApiError> {
    let errorData: ApiError = {
      message: `HTTP ${response.status}: ${response.statusText}`,
      status: response.status,
    };

    try {
      const text = await response.text();
      if (text) {
        const parsed = JSON.parse(text);
        errorData = {
          message: parsed.message || parsed.error || errorData.message,
          status: response.status,
          code: parsed.code,
          details: parsed,
        };
      }
    } catch {
      // If parsing fails, use default error
    }

    // Handle unauthorized
    if (response.status === 401 && !skipErrorHandling) {
      this.onUnauthorized?.();
    }

    return errorData;
  }

  /**
   * Make a request to the API
   */
  async request<T = unknown>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      skipAuth = false,
      skipErrorHandling = false,
      headers = {},
      ...restConfig
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders: HeadersInit = {
      "Content-Type": "application/json",
      ...(skipAuth ? {} : this.getAuthHeaders()),
      ...headers,
    };

    try {
      const response = await fetch(url, {
        ...restConfig,
        headers: requestHeaders,
      });

      if (!response.ok) {
        const error = await this.handleError(response, skipErrorHandling);
        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        return (text ? JSON.parse(text) : {}) as T;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof Error && "status" in error) {
        throw error;
      }
      throw {
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      } as ApiError;
    }
  }

  /**
   * GET request
   */
  async get<T = unknown>(
    endpoint: string,
    params?: Record<string, unknown>,
    config?: RequestConfig
  ): Promise<T> {
    const queryString = this.buildQueryString(params);
    return this.request<T>(`${endpoint}${queryString}`, {
      ...config,
      method: "GET",
    });
  }

  /**
   * POST request
   */
  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = unknown>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "DELETE",
    });
  }
}

// Create singleton instance
let apiClientInstance: ApiClient | null = null;

/**
 * Initialize the API client
 */
export function initApiClient(config: ApiClientConfig): ApiClient {
  apiClientInstance = new ApiClient(config);
  return apiClientInstance;
}

/**
 * Get the API client instance
 */
export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    throw new Error(
      "API client not initialized. Call initApiClient() first."
    );
  }
  return apiClientInstance;
}

/**
 * Create API client with default config
 */
export function createApiClient(
  getAccessToken?: () => string | null,
  onUnauthorized?: () => void
): ApiClient {
  return new ApiClient({
    baseURL: env.API_BASE_URL,
    getAccessToken,
    onUnauthorized,
  });
}

export default ApiClient;

