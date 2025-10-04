export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface LoginError {
  message: string;
}

export interface AuthState {
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}
