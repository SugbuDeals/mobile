/**
 * Authentication API endpoints
 */

import { getApiClient } from "../client";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    name?: string;
    fullname?: string;
    email: string;
    role?: string;
    user_type?: string;
    [key: string]: unknown;
  };
}

export const authApi = {
  /**
   * Login
   */
  login: (credentials: LoginCredentials): Promise<LoginResponse> => {
    return getApiClient().post<LoginResponse>(
      "/auth/login",
      credentials,
      { skipAuth: true }
    );
  },

  /**
   * Register
   */
  register: (payload: RegisterPayload): Promise<unknown> => {
    return getApiClient().post("/auth/register", payload, {
      skipAuth: true,
    });
  },
};

