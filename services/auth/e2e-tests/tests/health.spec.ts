import { test, expect } from '@playwright/test';

test.describe('Auth Health Check', () => {
  test('health endpoint should return 200 and status ok', async ({ request }) => {
    // Send a request to the health check endpoint
    const response = await request.get('/auth/health');
    
    // Verify response status is 200
    expect(response.status()).toBe(200);
    
    // Verify response body contains status: ok
    const body = await response.json();
    expect(body).toHaveProperty('status', 'ok');
  });
});
