export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  data: {
    username: string;
    token: string;
    roles: string[];
  };
  message: string;
  status: number;
  success: boolean;
}

export interface User {
  username: string;
  token: string;
  roles: string[];
}

export interface Role {
  id?: number;
  name: string;
  users?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterRequest {
  id?: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  username: string;
  email: string;
  password: string;
  roles?: Role[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterResponse {
  data: string;
  message: string;
  status: number;
  success: boolean;
}