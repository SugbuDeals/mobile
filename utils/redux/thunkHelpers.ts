/**
 * Common thunk helper utilities
 */

import { RootState } from "@/store/types";

/**
 * Get access token from state
 */
export function getAccessToken(state: RootState): string | null {
  return state.auth.accessToken;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(state: RootState): boolean {
  return !!state.auth.accessToken && !!state.auth.user;
}

/**
 * Get current user from state
 */
export function getCurrentUser(state: RootState) {
  return state.auth.user;
}

/**
 * Create error message from various error types
 */
export function createErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
}

