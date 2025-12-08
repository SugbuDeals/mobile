/**
 * Auth feature types
 * Uses Swagger-generated types from services/api/types/swagger
 */

import type {
  LoginDTO,
  RegisterDTO,
  UserResponseDto,
  AuthResponseDto,
} from "@/services/api/types/swagger";

// Re-export Swagger types
export type { UserResponseDto, AuthResponseDto };

// Alias for backward compatibility
export type LoginCredentials = LoginDTO;
export type { RegisterDTO as RegisterPayload };

/**
 * Login/Register response - using AuthResponseDto
 * Note: We maintain user_type mapping for internal app state compatibility
 */
export interface LoginResponse {
  access_token: string;
  user: UserResponseDto & {
    user_type?: 'consumer' | 'retailer' | 'admin'; // Mapped from role for internal use
    retailer_setup_completed?: boolean; // Internal app state
  };
}

/**
 * Login error response
 */
export interface LoginError {
  message: string;
}

/**
 * Auth state interface
 */
export interface AuthState {
  accessToken: string | null;
  user: LoginResponse['user'] | null;
  loading: boolean;
  error: string | null;
}


/**
 * Register error response
 */
export interface RegisterError { 
  message: string;
}
