/**
 * Utility functions for auth service e2e tests
 */
import { APIRequestContext, APIResponse } from '@playwright/test';

export interface AuthResponse {
  id: number;
  email: string;
  role: string;
  accessToken: string;
}

export interface ApiResponse<T> {
  response: APIResponse;
  responseBody: T;
  email: string;
  password: string;
}

// Generate a random email address for testing
export function generateRandomEmail(): string {
  const randomString = Math.random().toString(36).substring(2, 10);
  return `test-${randomString}@example.com`;
}

// Generate a random password for testing
export function generateRandomPassword(): string {
  return `Password${Math.floor(Math.random() * 1000000)}`;
}

// Register a new user and return response details
export async function registerNewUser(
  request: APIRequestContext,
  email?: string,
  password?: string,
): Promise<ApiResponse<AuthResponse>> {
  const userEmail = email || generateRandomEmail();
  const userPassword = password || generateRandomPassword();
  
  const response = await request.post('/auth/register', {
    data: {
      email: userEmail,
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
    },
  });
  
  const responseBody = (await response.json()) as AuthResponse;
  return { response, responseBody, email: userEmail, password: userPassword };
}

// Login a user and return response details
export async function loginUser(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<ApiResponse<AuthResponse>> {
  const response = await request.post('/auth/login', {
    data: {
      email,
      password,
    },
  });
  
  const responseBody = (await response.json()) as AuthResponse;
  return { response, responseBody, email, password };
}
