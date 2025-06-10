import { test, expect } from '@playwright/test';
import { registerNewUser } from './utils';

interface AuthResponse {
  id: number;
  email: string;
  role: string;
  accessToken: string;
}

interface ProfileResponse {
  id: number;
  email: string;
  role: string;
}

test.describe('Auth Profile API', () => {
  test('should get user profile when authenticated', async ({ request }) => {
    // First register a new user to get an access token
    const { responseBody } = await registerNewUser(request);
    const authResponse = responseBody as AuthResponse;
    const accessToken = authResponse.accessToken;
    
    // Send profile request with bearer token
    const profileResponse = await request.get('/auth/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    
    // Verify response status is 200 OK
    expect(profileResponse.status()).toBe(200);
    
    // Verify response contains user information
    const body = (await profileResponse.json()) as ProfileResponse;
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email');
    expect(body).toHaveProperty('role');
  });

  test('should return 401 when not authenticated', async ({ request }) => {
    const response = await request.get('/auth/profile');
    
    // Verify unauthorized response
    expect(response.status()).toBe(401);
  });
  
  test('should return 401 when using invalid token', async ({ request }) => {
    const response = await request.get('/auth/profile', {
      headers: {
        Authorization: 'Bearer invalid-token',
      }
    });
    
    // Verify unauthorized response
    expect(response.status()).toBe(401);
  });
});
