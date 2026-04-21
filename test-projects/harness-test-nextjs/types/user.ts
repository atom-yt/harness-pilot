// Test types for harness validation
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export type UserRole = 'admin' | 'user' | 'guest';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}