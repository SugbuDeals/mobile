/**
 * Login credentials matching server.json LoginDTO
 */
export interface LoginCredentials {
  email: string;
  password: string;
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
 * Register payload matching server.json RegisterDTO
 * Note: ADMIN role cannot be assigned via registration
 */
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'CONSUMER' | 'RETAILER';
}

/**
 * Register error response
 */
export interface RegisterError { 
  message: string;
}
