export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    fullname: string;
    phone: string;
    user_type: 'consumer' | 'retailer';
    retailer_setup_completed?: boolean;
  };
}

export interface LoginError {
  message: string;
}

export interface AuthState {
  accessToken: string | null;
  user: LoginResponse['user'] | null;
  loading: boolean;
  error: string | null;
}
