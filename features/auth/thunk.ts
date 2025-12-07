import { authApi, usersApi } from "@/services/api";
import type { RootState } from "@/store/types";
import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  LoginCredentials,
  LoginError,
  LoginResponse,
  RegisterError,
  RegisterPayload,
} from "./types";

/**
 * Map server role (CONSUMER/RETAILER/ADMIN) to user_type (consumer/retailer/admin)
 * Aligned with server.json spec where role is uppercase enum
 */
function mapRoleToUserType(role?: string): "consumer" | "retailer" | "admin" | undefined {
  if (!role || typeof role !== 'string') {
    return undefined;
  }
  
  const roleUpper = role.toUpperCase();
  if (roleUpper === 'CONSUMER') return 'consumer';
  if (roleUpper === 'RETAILER') return 'retailer';
  if (roleUpper === 'ADMIN') return 'admin';
  
  return undefined;
}

/**
 * Validate and normalize user ID (ensure it's a number)
 */
function normalizeUserId(id: unknown): number {
  if (typeof id === 'number') {
    return id;
  }
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  throw new Error('Invalid user ID: must be a number');
}

/**
 * Async thunk action creator for handling user login
 *
 * @param credentials - The user login credentials containing email and password
 * @returns A promise that resolves to the login payload containing user data and token
 * @throws {LoginError} When login fails due to invalid credentials or server error
 *
 * @example
 * ```typescript
 * // Dispatch login action
 * dispatch(login({
 *   email: 'user@example.com',
 *   password: 'password123'
 * }))
 * ```
 */
export const login = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: LoginError }
>("auth/login", async (credentials, { rejectWithValue }) => {
  // Log login attempt (sanitized - no password)
  console.log('[Auth] Login attempt', {
    email: credentials.email,
    hasPassword: !!credentials.password,
  });

  try {
    // Validate input
    if (!credentials.email || typeof credentials.email !== 'string') {
      console.error('[Auth] Invalid login credentials: missing or invalid email');
      return rejectWithValue({
        message: "Email is required",
      });
    }

    if (!credentials.password || typeof credentials.password !== 'string') {
      console.error('[Auth] Invalid login credentials: missing or invalid password');
      return rejectWithValue({
        message: "Password is required",
      });
    }

    // Call API
    const response = await authApi.login(credentials);
    
    console.log('[Auth] Login API response received', {
      hasAccessToken: !!response.access_token,
      hasUser: !!response.user,
      userId: response.user?.id,
      userRole: response.user?.role,
    });
    
    // Validate access_token
    if (!response.access_token || typeof response.access_token !== 'string') {
      console.error('[Auth] Invalid response: access_token missing or invalid', {
        accessTokenType: typeof response.access_token,
        hasAccessToken: !!response.access_token,
      });
      return rejectWithValue({
        message: "Invalid response: access token not found",
      });
    }
    
    // Validate user object
    if (!response.user || typeof response.user !== 'object') {
      console.error('[Auth] Invalid response: user data missing or invalid', {
        userType: typeof response.user,
        hasUser: !!response.user,
      });
      return rejectWithValue({
        message: "Invalid response: user data not found",
      });
    }
    
    // Validate required user fields
    if (typeof response.user.id !== 'number' && typeof response.user.id !== 'string') {
      console.error('[Auth] Invalid response: user.id missing or invalid', {
        idType: typeof response.user.id,
        idValue: response.user.id,
      });
      return rejectWithValue({
        message: "Invalid response: user ID is required",
      });
    }
    
    if (!response.user.email || typeof response.user.email !== 'string') {
      console.error('[Auth] Invalid response: user.email missing or invalid', {
        emailType: typeof response.user.email,
        hasEmail: !!response.user.email,
      });
      return rejectWithValue({
        message: "Invalid response: user email is required",
      });
    }
    
    // Normalize user ID (ensure it's a number)
    let userId: number;
    try {
      userId = normalizeUserId(response.user.id);
    } catch (error) {
      console.error('[Auth] Failed to normalize user ID', {
        originalId: response.user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return rejectWithValue({
        message: "Invalid response: user ID format is invalid",
      });
    }
    
    // Map role to user_type (server returns CONSUMER/RETAILER/ADMIN, we need consumer/retailer/admin)
    const userType = mapRoleToUserType(response.user.role);
    
    console.log('[Auth] Login successful', {
      userId,
      email: response.user.email,
      role: response.user.role,
      userType,
    });
    
    // Build response with proper type mapping
    // response.user is validated to have all required fields per server.json
    const result: LoginResponse = {
      access_token: response.access_token,
      user: {
        ...response.user, // All required fields are present per validation
        user_type: userType, // Mapped from role for internal use
      },
    };
    
    return result;
  } catch (error: any) {
    // Extract error message with proper handling
    let errorMessage = "Login failed";
    const errorStatus = error?.status;
    
    // Handle ApiError objects (from API client)
    if (error && typeof error === 'object') {
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error.details?.message && typeof error.details.message === 'string') {
        errorMessage = error.details.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Log based on error type:
    // - 401 (Invalid credentials) = expected user error, log as warning
    // - Other errors = system/network errors, log as error
    const isUserError = errorStatus === 401;
    const logLevel = isUserError ? 'warn' : 'error';
    const logMessage = isUserError 
      ? '[Auth] Login failed: Invalid credentials' 
      : '[Auth] Login error';
    
    console[logLevel](logMessage, {
      message: errorMessage,
      status: errorStatus,
      hasDetails: !!error?.details,
      errorType: error instanceof Error ? 'Error' : typeof error,
      ...(process.env.NODE_ENV === 'development' && {
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : undefined,
        fullError: error,
      }),
    });
    
    return rejectWithValue({
      message: errorMessage,
    });
  }
});

/**
 * Fetch user details by id using the current access token
 */
export const fetchUserById = createAsyncThunk<
  any,
  number,
  { rejectValue: LoginError; state: RootState }
>("auth/fetchUserById", async (id, { rejectWithValue }) => {
  try {
    return await usersApi.findUserById(id);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Failed to fetch user",
    });
  }
});

/**
 * Update user details by id (name/email)
 */
export const updateUser = createAsyncThunk<
  any,
  { id: number; data: { name?: string; email?: string; imageUrl?: string | null } },
  { rejectValue: LoginError; state: RootState }
>("auth/updateUser", async ({ id, data }, { rejectWithValue }) => {
  try {
    return await usersApi.updateUser(id, data);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Failed to update user",
    });
  }
});

/**
 * Register a new user
 * Aligned with server.json RegisterDTO spec
 */
export const register = createAsyncThunk<
  LoginResponse,
  RegisterPayload,
  { rejectValue: RegisterError }
>("auth/register", async (payload, { rejectWithValue }) => {
  // Log registration attempt (sanitized)
  console.log('[Auth] Registration attempt', {
    email: payload.email,
    name: payload.name,
    role: payload.role,
    hasPassword: !!payload.password,
  });

  try {
    // Validate input
    if (!payload.name || typeof payload.name !== 'string') {
      console.error('[Auth] Invalid registration payload: missing or invalid name');
      return rejectWithValue({
        message: "Name is required",
      });
    }

    if (!payload.email || typeof payload.email !== 'string') {
      console.error('[Auth] Invalid registration payload: missing or invalid email');
      return rejectWithValue({
        message: "Email is required",
      });
    }

    if (!payload.password || typeof payload.password !== 'string') {
      console.error('[Auth] Invalid registration payload: missing or invalid password');
      return rejectWithValue({
        message: "Password is required",
      });
    }

    if (!payload.role || (payload.role !== 'CONSUMER' && payload.role !== 'RETAILER')) {
      console.error('[Auth] Invalid registration payload: invalid role', {
        role: payload.role,
      });
      return rejectWithValue({
        message: "Role must be CONSUMER or RETAILER",
      });
    }

    // Build API payload (role is already CONSUMER | RETAILER from RegisterPayload type)
    const apiPayload = {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    } as { name: string; email: string; password: string; role: "CONSUMER" | "RETAILER" };
    
    const response = await authApi.register(apiPayload);
    
    console.log('[Auth] Registration API response received', {
      hasAccessToken: !!response.access_token,
      hasUser: !!response.user,
      userId: response.user?.id,
      userRole: response.user?.role,
    });
    
    // Validate access_token
    const accessToken = response.access_token;
    if (!accessToken || typeof accessToken !== 'string') {
      console.error('[Auth] Invalid response: access_token missing or invalid', {
        accessTokenType: typeof accessToken,
        hasAccessToken: !!accessToken,
      });
      return rejectWithValue({
        message: "Invalid response: access token not found",
      });
    }
    
    // Validate user object
    if (!response.user || typeof response.user !== 'object') {
      console.error('[Auth] Invalid response: user data missing or invalid', {
        userType: typeof response.user,
        hasUser: !!response.user,
      });
      return rejectWithValue({
        message: "Invalid response: user data not found",
      });
    }
    
    // Validate required user fields
    if (typeof response.user.id !== 'number' && typeof response.user.id !== 'string') {
      console.error('[Auth] Invalid response: user.id missing or invalid', {
        idType: typeof response.user.id,
        idValue: response.user.id,
      });
      return rejectWithValue({
        message: "Invalid response: user ID is required",
      });
    }
    
    if (!response.user.email || typeof response.user.email !== 'string') {
      console.error('[Auth] Invalid response: user.email missing or invalid', {
        emailType: typeof response.user.email,
        hasEmail: !!response.user.email,
      });
      return rejectWithValue({
        message: "Invalid response: user email is required",
      });
    }
    
    // Normalize user ID (ensure it's a number)
    let userId: number;
    try {
      userId = normalizeUserId(response.user.id);
    } catch (error) {
      console.error('[Auth] Failed to normalize user ID', {
        originalId: response.user.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return rejectWithValue({
        message: "Invalid response: user ID format is invalid",
      });
    }
    
    // Map role to user_type (server returns CONSUMER/RETAILER/ADMIN, we need consumer/retailer/admin)
    const userType = mapRoleToUserType(response.user.role);
    
    console.log('[Auth] Registration successful', {
      userId,
      email: response.user.email,
      role: response.user.role,
      userType,
    });
    
    // Build response with proper type mapping
    // response.user is validated to have all required fields per server.json
    const result: LoginResponse = {
      access_token: accessToken,
      user: {
        ...response.user, // All required fields are present per validation
        user_type: userType, // Mapped from role for internal use
      },
    };
    
    return result;
  } catch (error: any) {
    // Extract error message with proper handling
    let errorMessage = "Registration failed";
    const errorStatus = error?.status;
    
    // Handle ApiError objects (from API client)
    if (error && typeof error === 'object') {
      if (error.message && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if (error.details?.message) {
        // Handle array messages (validation errors from server)
        if (Array.isArray(error.details.message)) {
          errorMessage = error.details.message.join('\n');
        } else if (typeof error.details.message === 'string') {
          errorMessage = error.details.message;
        }
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    // Log based on error type:
    // - 400 (Validation errors) = expected user error, log as warning
    // - Other errors = system/network errors, log as error
    const isUserError = errorStatus === 400 || errorStatus === 401;
    const logLevel = isUserError ? 'warn' : 'error';
    const logMessage = isUserError 
      ? '[Auth] Registration failed: Validation error' 
      : '[Auth] Registration error';
    
    console[logLevel](logMessage, {
      message: errorMessage,
      status: errorStatus,
      hasDetails: !!error?.details,
      errorType: error instanceof Error ? 'Error' : typeof error,
      ...(process.env.NODE_ENV === 'development' && {
        errorKeys: error && typeof error === 'object' ? Object.keys(error) : undefined,
        fullError: error,
      }),
    });
    
    return rejectWithValue({
      message: errorMessage,
    });
  }
});

/**
 * Delete user account by id
 */
export const deleteUser = createAsyncThunk<
  { success: boolean },
  number,
  { rejectValue: LoginError; state: RootState }
>("auth/deleteUser", async (id, { rejectWithValue }) => {
  try {
    await usersApi.deleteUser(id);
    return { success: true };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Failed to delete user account",
    });
  }
});

/**
 * Fetch all users with optional filters
 */
export const fetchAllUsers = createAsyncThunk<
  any[],
  { name?: string; email?: string; skip?: number; take?: number } | void,
  { rejectValue: LoginError; state: RootState }
>("auth/fetchAllUsers", async (params, { rejectWithValue }) => {
  try {
    return await usersApi.findUsers(params || undefined);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Failed to fetch users",
    });
  }
});

/**
 * Delete user by admin (remove user account)
 */
export const deleteUserByAdmin = createAsyncThunk<
  { success: boolean },
  number,
  { rejectValue: LoginError; state: RootState }
>("auth/deleteUserByAdmin", async (id, { rejectWithValue }) => {
  try {
    await usersApi.deleteUser(id);
    return { success: true };
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Failed to delete user",
    });
  }
});

/**
 * Approve retailer account (admin only)
 */
export const approveRetailer = createAsyncThunk<
  any,
  number,
  { rejectValue: LoginError; state: RootState }
>("auth/approveRetailer", async (id, { rejectWithValue }) => {
  try {
    return await usersApi.approveRetailer(id);
  } catch (error: any) {
    return rejectWithValue({
      message: error?.message || "Failed to approve retailer",
    });
  }
});