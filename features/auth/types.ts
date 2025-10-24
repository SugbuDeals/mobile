export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number | string;
    email: string;
    name?: string;
    fullname?: string;
    role?: 'CONSUMER' | 'RETAILER' | string;
    user_type?: 'consumer' | 'retailer';
    createdAt?: string;
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

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'CONSUMER' | 'RETAILER';
}

export interface RegisterError { message: string }
