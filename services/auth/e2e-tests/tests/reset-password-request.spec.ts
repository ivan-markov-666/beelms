import { test, expect } from '@playwright/test';
import { registerNewUser } from './utils';

test.describe('Auth Reset Password Request API', () => {
  test('should process reset password request for existing user', async ({ request }) => {
    // First register a new user
    const { email } = await registerNewUser(request);
    
    // Send reset password request
    const response = await request.post('/auth/reset-password-request', {
      data: {
        email
      }
    });
    
    // Verify response status is 200 OK
    expect(response.status()).toBe(200);
    
    // Verify response contains success message
    // Note: The message should be generic for security reasons
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Ако имейлът съществува');
  });
  
  test('should return same response for non-existent email (security feature)', async ({ request }) => {
    // Send reset password request for non-existent email
    const response = await request.post('/auth/reset-password-request', {
      data: {
        email: 'nonexistent-user@example.com'
      }
    });
    
    // Should still return 200 OK (security feature to prevent user enumeration)
    expect(response.status()).toBe(200);
    
    // Should have same generic message
    const body = await response.json();
    expect(body).toHaveProperty('message');
    expect(body.message).toContain('Ако имейлът съществува');
  });
});
