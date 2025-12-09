/**
 * Base API client with authentication and error handling
 */

import env from "@/config/env";
import { ApiError, ApiResponse, ErrorResponse } from "./types/common";

export interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
  skipUnauthorizedCallback?: boolean;
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
   * Log API request/response/error with sanitized data
   * Only logs errors and warnings to reduce console spam
   */
  private log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
    // Only log errors and warnings, skip info logs to reduce console spam
    if (level === 'info') {
      return;
    }
    
    const sanitizedData = this.sanitizeLogData(data);
    const logMessage = `[API Client] ${message}`;
    
    if (level === 'error') {
      console.error(logMessage, sanitizedData);
    } else if (level === 'warn') {
      console.warn(logMessage, sanitizedData);
    }
  }

  /**
   * Sanitize sensitive data from logs (passwords, tokens, etc.)
   */
  private sanitizeLogData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return undefined;
    
    const sensitiveKeys = ['password', 'access_token', 'token', 'authorization', 'authorization'];
    const sanitized = { ...data };
    
    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeLogData(sanitized[key] as Record<string, unknown>);
      }
    }
    
    return sanitized;
  }

  /**
   * Handle API errors
   */
  private async handleError(
    response: Response,
    skipErrorHandling?: boolean,
    skipUnauthorizedCallback?: boolean,
    endpoint?: string
  ): Promise<ApiError> {
    let errorData: ApiError = {
      message: `HTTP ${response.status}: ${response.statusText}`,
      status: response.status,
      statusCode: response.status,
    };

    try {
      const text = await response.text();
      if (text) {
        const parsed: ErrorResponse = JSON.parse(text);
        
        // Handle Swagger error response format: { statusCode: number, message: string | string[] }
        let message = errorData.message;
        if (parsed.statusCode !== undefined) {
          errorData.statusCode = parsed.statusCode;
          errorData.status = parsed.statusCode;
        }
        
        if (parsed.message) {
          if (Array.isArray(parsed.message)) {
            // Join array messages with newlines for readability (validation errors)
            message = parsed.message.join('\n');
          } else if (typeof parsed.message === 'string') {
            message = parsed.message;
          }
        } else if (parsed.error) {
          message = typeof parsed.error === 'string' ? parsed.error : errorData.message;
        }
        
        errorData = {
          message,
          status: parsed.statusCode || response.status,
          statusCode: parsed.statusCode || response.status,
          code: 'code' in parsed && typeof parsed.code === 'string' ? parsed.code : undefined,
          details: parsed,
        };
      }
    } catch {
      // If parsing fails, use default error
    }

    // Log error with context
    // 401 errors (Invalid credentials) are expected user errors, log as warning
    // Other errors are system/network errors, log as error
    const isUserError = response.status === 401;
    const logLevel = isUserError ? 'warn' : 'error';
    const logMessage = isUserError 
      ? `API Warning (User Error): ${endpoint || 'Unknown endpoint'}`
      : `API Error: ${endpoint || 'Unknown endpoint'}`;
    
    this.log(logLevel, logMessage, {
      status: response.status,
      statusText: response.statusText,
      message: errorData.message,
      endpoint,
    });

    // Handle unauthorized - only call callback if not skipped
    // Login/register endpoints should skip this to avoid false "Unauthorized API request" messages
    if (response.status === 401 && !skipErrorHandling && !skipUnauthorizedCallback) {
      this.log('warn', 'Unauthorized request detected, calling onUnauthorized callback', {
        endpoint,
      });
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
      skipUnauthorizedCallback = false,
      headers = {},
      body,
      ...restConfig
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    
    // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
    const isFormData = body instanceof FormData;
    
    const requestHeaders: HeadersInit = {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(skipAuth ? {} : this.getAuthHeaders()),
      ...headers,
    };

    // Log request (sanitized)
    let requestBodyPreview: unknown = undefined;
    if (body && !isFormData && typeof body === 'string') {
      try {
        const parsed = JSON.parse(body);
        requestBodyPreview = this.sanitizeLogData(parsed as Record<string, unknown>) || parsed;
      } catch {
        requestBodyPreview = '[Unable to parse body]';
      }
    }
    
    this.log('info', `Request: ${restConfig.method || 'GET'} ${endpoint}`, {
      method: restConfig.method || 'GET',
      endpoint,
      skipAuth,
      hasBody: !!body,
      isFormData,
      body: requestBodyPreview,
    });

    try {
      const response = await fetch(url, {
        ...restConfig,
        body: body,
        headers: requestHeaders,
      });

      // Log response status
      this.log('info', `Response: ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        const error = await this.handleError(
          response,
          skipErrorHandling,
          skipUnauthorizedCallback,
          endpoint
        );
        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        let result: T;
        try {
          result = (text ? JSON.parse(text) : {}) as T;
        } catch (parseError) {
          this.log('error', `Failed to parse non-JSON response: ${endpoint}`, {
            textLength: text?.length,
            parseError: parseError instanceof Error ? parseError.message : String(parseError),
          });
          result = {} as T;
        }
        this.log('info', `Response parsed (non-JSON): ${endpoint}`, {
          hasContent: !!text,
        });
        return result;
      }

      let result: T;
      try {
        result = await response.json() as T;
      } catch (parseError) {
        this.log('error', `Failed to parse JSON response: ${endpoint}`, {
          status: response.status,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        });
        throw {
          message: `Failed to parse server response: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`,
          status: response.status,
        } as ApiError;
      }
      
      this.log('info', `Response parsed (JSON): ${endpoint}`, {
        hasData: !!result,
      });
      return result;
    } catch (error) {
      // Check if it's already an ApiError (either Error instance with status or plain object with message)
      const isApiError = 
        (error instanceof Error && "status" in error) ||
        (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string');
      
      if (isApiError) {
        // Re-throw ApiError as-is
        throw error;
      }
      
      // Handle network errors and other non-ApiError exceptions
      let errorMessage = "An unknown error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String((error as any).message);
      }
      
      const isNetworkError = 
        errorMessage.includes("Network request failed") ||
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("connection") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("timeout");
      
      this.log('error', `Network/Request Error: ${endpoint}`, {
        error: errorMessage,
        isNetworkError,
        errorType: error instanceof Error ? 'Error' : typeof error,
        hasStatus: typeof error === 'object' && error !== null && 'status' in error,
      });
      
      throw {
        message: isNetworkError 
          ? "Network error. Please check your internet connection and ensure the server is running."
          : errorMessage,
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
    // If data is FormData, use it directly; otherwise stringify JSON
    const body = data instanceof FormData ? data : data ? JSON.stringify(data) : undefined;
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body,
    });
  }

  /**
   * Upload a file (multipart/form-data)
   */
  async uploadFile<T = unknown>(
    endpoint: string,
    file: File | Blob | { uri: string; type?: string; name?: string },
    fieldName: string = "file",
    config?: RequestConfig
  ): Promise<T> {
    const formData = new FormData();
    
    // Handle different file types
    if (file instanceof File || file instanceof Blob) {
      formData.append(fieldName, file);
    } else if (file.uri) {
      // React Native file upload - create a file-like object
      // In React Native, we need to use a different approach
      // For now, we'll assume the file is already a File/Blob or use fetch with FormData
      const fileData = {
        uri: file.uri,
        type: file.type || "application/octet-stream",
        name: file.name || "file",
      } as any;
      formData.append(fieldName, fileData);
    }
    
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: formData,
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

