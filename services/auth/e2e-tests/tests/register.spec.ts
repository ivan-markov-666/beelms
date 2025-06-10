import { test, expect } from '@playwright/test';
import { generateRandomEmail, generateRandomPassword } from './utils';

test.describe('Auth Register API', () => {
  test('should register a new user successfully', async ({ request }) => {
    // Generate test data
    const email = generateRandomEmail();
    const password = generateRandomPassword();
    
    // Send registration request
    const response = await request.post('/auth/register', {
      data: {
        email,
        password,
        firstName: 'Test',
        lastName: 'User'
      }
    });
    
    // Verify response status is 201 Created
    expect(response.status()).toBe(201);
    
    // Verify response body contains user data and access token
    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('email', email);
    expect(body).toHaveProperty('role', 'user'); // assuming default role is 'user'
    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.accessToken.length).toBeGreaterThan(20); // JWT token should be reasonably long
  });
  
  test('should return error when registering with invalid data', async ({ request }) => {
    // Send registration request with invalid email
    const response = await request.post('/auth/register', {
      data: {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User'
      }
    });
    
    // Verify response status is 400 Bad Request
    expect(response.status()).toBe(400);
    
    // Verify response body contains validation error
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(Array.isArray(body.message)).toBe(true);
  });
});
