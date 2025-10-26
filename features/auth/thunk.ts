import env from "@/config/env";
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
 * Async thunk action creator for handling user login
 *
 * @param credentials - The user login credentials containing username/email and password
 * @returns A promise that resolves to the login payload containing user data and token
 * @throws {LoginError} When login fails due to invalid credentials or server error
 *
 * @example
 * ```typescript
 * // Dispatch login action
 * dispatch(login({
 *   username: 'user@example.com',
 *   password: 'password123'
 * }))
 * ```
 */
export const login = createAsyncThunk<
  LoginResponse,
  LoginCredentials,
  { rejectValue: LoginError }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const response = await fetch(`${env.API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      return rejectWithValue({ message: error.message || "Login Failed" });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
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
>("auth/fetchUserById", async (id, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.accessToken;
    const response = await fetch(`${env.API_BASE_URL}/user/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Failed to fetch user",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

/**
 * Update user details by id (name/email)
 */
export const updateUser = createAsyncThunk<
  any,
  { id: number; data: { name?: string; email?: string } },
  { rejectValue: LoginError; state: RootState }
>("auth/updateUser", async ({ id, data }, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.accessToken;
    const response = await fetch(`${env.API_BASE_URL}/user/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Failed to update user",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});

/**
 * Register a new user
 */
export const register = createAsyncThunk<
  any,
  RegisterPayload,
  { rejectValue: RegisterError }
>("auth/register", async (payload, { rejectWithValue }) => {
  try {
    const response = await fetch(`${env.API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Registration failed",
      });
    }
    
    const userData = await response.json();
    return userData;
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
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
>("auth/deleteUser", async (id, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.accessToken;
    const response = await fetch(`${env.API_BASE_URL}/user/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Failed to delete user account",
      });
    }

    return { success: true };
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
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
>("auth/fetchAllUsers", async (params, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.accessToken;
    
    // Build query string
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.name) searchParams.append("name", params.name);
      if (params.email) searchParams.append("email", params.email);
      if (params.skip) searchParams.append("skip", params.skip.toString());
      if (params.take) searchParams.append("take", params.take.toString());
    }
    
    const url = `${env.API_BASE_URL}/user${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Failed to fetch users",
      });
    }

    return response.json();
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
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
>("auth/deleteUserByAdmin", async (id, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.accessToken;
    const response = await fetch(`${env.API_BASE_URL}/user/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return rejectWithValue({
        message: error.message || "Failed to delete user",
      });
    }

    return { success: true };
  } catch (error) {
    return rejectWithValue({
      message:
        error instanceof Error ? error.message : "An unknown error occured",
    });
  }
});