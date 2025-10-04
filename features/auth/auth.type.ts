export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}

export interface LoginError {
  message: string;
}

export interface AuthState {
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}
