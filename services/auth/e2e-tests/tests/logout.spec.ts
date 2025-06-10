import { test, expect } from '@playwright/test';
import { registerNewUser } from './utils';

interface AuthResponse {
  id: number;
  email: string;
  role: string;
  accessToken: string;
}

interface LogoutResponse {
  message: string;
}

test.describe('Auth Logout API', () => {
  test('should logout a user successfully', async ({ request }) => {
    // First register a new user to get an access token
    const { responseBody } = await registerNewUser(request);
    const authResponse = responseBody as AuthResponse;
    const accessToken = authResponse.accessToken;
    
    // Send logout request with bearer token
    const logoutResponse = await request.post('/auth/logout', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    
    // Verify response status
    expect(logoutResponse.status()).toBe(200);
    
    // Verify response contains logout success message
    const body = (await logoutResponse.json()) as LogoutResponse;
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Успешно излизане от системата');
    
    // Verify token is invalidated by trying to use it again for a protected endpoint
    const profileResponse = await request.get('/auth/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    
    // Token should be invalid after logout
    expect(profileResponse.status()).toBe(401);
  });
  
  test('should return 401 when not authenticated', async ({ request }) => {
    // Attempt to logout without a token
    const response = await request.post('/auth/logout');
    
    // Verify unauthorized response
    expect(response.status()).toBe(401);
  });
});
