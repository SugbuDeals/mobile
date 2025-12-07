/**
 * Authentication API endpoints
 * 
 * Aligned with server.json OpenAPI specification:
 * - Login: POST /auth/login
 * - Register: POST /auth/register
 */

import { getApiClient } from "../client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: "CONSUMER" | "RETAILER";
}

/**
 * UserResponseDto matching server.json UserResponseDto
 * Exact structure from server.json schema
 */
export interface UserResponseDto {
  id: number;
  email: string;
  name: string;
  createdAt: string; // ISO 8601 format date-time
  role: "CONSUMER" | "RETAILER" | "ADMIN";
  imageUrl: string | null; // Nullable per server.json
}

/**
 * AuthResponseDto matching server.json AuthResponseDto
 * Used for login and register responses
 */
export interface AuthResponseDto {
  access_token: string;
  user: UserResponseDto;
}

/**
 * LoginResponse - using AuthResponseDto
 * Extended for internal app state compatibility
 */
export interface LoginResponse {
  access_token: string;
  user: UserResponseDto & {
    user_type?: 'consumer' | 'retailer' | 'admin'; // Mapped from role for internal use
    retailer_setup_completed?: boolean; // Internal app state
  };
}

/**
 * Validate login response structure
 * Aligned with server.json AuthResponseDto spec
 */
function validateLoginResponse(data: unknown): data is AuthResponseDto {
  if (!data || typeof data !== 'object') {
    console.error('[Auth API] Validation failed: data is not an object', { dataType: typeof data, data });
    return false;
  }
  
  const response = data as Record<string, unknown>;
  
  // Check access_token
  if (typeof response.access_token !== 'string' || !response.access_token) {
    console.error('[Auth API] Validation failed: access_token missing or invalid', {
      hasAccessToken: !!response.access_token,
      accessTokenType: typeof response.access_token,
      responseKeys: Object.keys(response),
    });
    return false;
  }
  
  // Check user object
  if (!response.user || typeof response.user !== 'object') {
    console.error('[Auth API] Validation failed: user object missing or invalid', {
      hasUser: !!response.user,
      userType: typeof response.user,
      responseKeys: Object.keys(response),
    });
    return false;
  }
  
  const user = response.user as Record<string, unknown>;
  
  // Check required user fields per server.json UserResponseDto
  // Allow id to be number or string (can be converted to number)
  const userId = user.id;
  const isValidId = typeof userId === 'number' || (typeof userId === 'string' && !isNaN(Number(userId)));
  
  if (!isValidId) {
    console.error('[Auth API] Validation failed: user.id is invalid', {
      idType: typeof userId,
      idValue: userId,
      userKeys: Object.keys(user),
    });
    return false;
  }
  
  // name is required per server.json
  if (typeof user.name !== 'string' || !user.name) {
    console.error('[Auth API] Validation failed: user.name is invalid', {
      nameType: typeof user.name,
      hasName: !!user.name,
      userKeys: Object.keys(user),
    });
    return false;
  }
  
  // email is required per server.json
  if (typeof user.email !== 'string' || !user.email) {
    console.error('[Auth API] Validation failed: user.email is invalid', {
      emailType: typeof user.email,
      hasEmail: !!user.email,
      userKeys: Object.keys(user),
    });
    return false;
  }
  
  // createdAt is required per server.json
  if (typeof user.createdAt !== 'string' || !user.createdAt) {
    console.error('[Auth API] Validation failed: user.createdAt is invalid', {
      createdAtType: typeof user.createdAt,
      hasCreatedAt: !!user.createdAt,
      userKeys: Object.keys(user),
    });
    return false;
  }
  
  // role is required per server.json
  if (typeof user.role !== 'string' || !['CONSUMER', 'RETAILER', 'ADMIN'].includes(user.role)) {
    console.error('[Auth API] Validation failed: user.role is invalid', {
      roleType: typeof user.role,
      roleValue: user.role,
      userKeys: Object.keys(user),
    });
    return false;
  }
  
  // imageUrl is nullable (can be string or null)
  if (user.imageUrl !== null && typeof user.imageUrl !== 'string') {
    console.error('[Auth API] Validation failed: user.imageUrl is invalid', {
      imageUrlType: typeof user.imageUrl,
      imageUrlValue: user.imageUrl,
      userKeys: Object.keys(user),
    });
    return false;
  }
  
  return true;
}

export const authApi = {
  /**
   * Login with email and password
   * Returns JWT access token and user data
   * 
   * @param credentials - Email and password
   * @returns Promise with access token and user data
   * @throws {ApiError} On invalid credentials (401) or server error
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await getApiClient().post<AuthResponseDto>(
      "/auth/login",
      credentials,
      { 
        skipAuth: true,
        skipUnauthorizedCallback: true, // Don't trigger onUnauthorized for login failures
      }
    );
    
    // Validate response structure
    if (!validateLoginResponse(response)) {
      throw {
        message: "Invalid response format from login endpoint",
        status: 500,
      };
    }
    
    // Return as LoginResponse with internal app state fields
    return {
      access_token: response.access_token,
      user: {
        ...response.user,
        // Map role to user_type for internal use
        user_type: response.user.role.toLowerCase() as 'consumer' | 'retailer' | 'admin',
      },
    };
  },

  /**
   * Register a new user account
   * Returns JWT access token and user data
   * 
   * @param payload - User registration data
   * @returns Promise with access token and user data
   * @throws {ApiError} On validation error (400) or server error
   */
  register: async (payload: RegisterPayload): Promise<LoginResponse> => {
    const response = await getApiClient().post<AuthResponseDto>(
      "/auth/register", 
      payload, 
      {
        skipAuth: true,
        skipUnauthorizedCallback: true, // Don't trigger onUnauthorized for registration failures
      }
    );
    
    // Log raw response for debugging
    console.log('[Auth API] Register response received', {
      hasResponse: !!response,
      responseType: typeof response,
      responseKeys: response && typeof response === 'object' ? Object.keys(response) : undefined,
      hasAccessToken: !!response?.access_token,
      hasUser: !!response?.user,
    });
    
    // Validate response structure
    if (!validateLoginResponse(response)) {
      // Log the actual response for debugging
      console.error('[Auth API] Register validation failed', {
        response,
        responseString: JSON.stringify(response, null, 2),
      });
      throw {
        message: "Invalid response format from register endpoint. Expected: { access_token: string, user: { id: number|string, email: string, name: string, createdAt: string, role: string, imageUrl: string|null } }",
        status: 500,
        details: {
          received: response,
        },
      };
    }
    
    // Return as LoginResponse with internal app state fields
    return {
      access_token: response.access_token,
      user: {
        ...response.user,
        // Map role to user_type for internal use
        user_type: response.user.role.toLowerCase() as 'consumer' | 'retailer' | 'admin',
      },
    };
  },
};

