import env from "@/config/env";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { LoginCredentials, LoginError, LoginResponse } from "./types";

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
