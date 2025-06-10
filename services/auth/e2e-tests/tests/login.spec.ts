import { test, expect } from '@playwright/test';
import { registerNewUser } from './utils';

test.describe('Auth Login API', () => {
  test('should login a user successfully', async ({ request }) => {
    // First register a new user
    const { email, password } = await registerNewUser(request);
    
    // Send login request with registered credentials
    const loginResponse = await request.post('/auth/login', {
      data: {
        email,
        password
      }
    });
    
    // Verify response status is 200 OK
    expect(loginResponse.status()).toBe(200);
    
    // Verify response body contains user data and access token
    const body = await loginResponse.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', email);
    expect(body).toHaveProperty('role');
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(20);
  });
  
  test('should return 401 when logging in with invalid credentials', async ({ request }) => {
    // Send login request with invalid credentials
    const loginResponse = await request.post('/auth/login', {
      data: {
        email: 'nonexistent@example.com',
        password: 'InvalidPassword123!'
      }
    });
    
    // Verify response status is 401 Unauthorized
    expect(loginResponse.status()).toBe(401);
    
    // Verify response body contains error message
    const body = await loginResponse.json();
    expect(body).toHaveProperty('message');
  });
});
