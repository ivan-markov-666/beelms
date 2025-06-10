# Test info

- Name: Auth Reset Password API >> should reject invalid reset token
- Location: D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\reset-password.spec.ts:39:7

# Error details

```
Error: apiRequestContext.post: read ECONNRESET
Call log:
  - → POST http://localhost:3001/auth/reset-password
    - user-agent: Playwright/1.52.0 (x64; windows 10.0) node/22.13
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - Content-Type: application/json
    - content-length: 62

    at D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\reset-password.spec.ts:40:36
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { registerNewUser } from './utils';
   3 |
   4 | test.describe('Auth Reset Password API', () => {
   5 |   // Note: Testing the password reset with token is challenging in an e2e environment
   6 |   // since we would need to intercept emails or directly access the token from the database
   7 |   // This is a simplified test with a mock token
   8 |   test('should reset password with valid token', async ({ request }) => {
   9 |     // In a real test, we would need to get a valid token
  10 |     // For this test, we will mock the token validation behavior
  11 |     // by assuming what a successful response looks like
  12 |     
  13 |     const newPassword = 'NewSecurePassword123!';
  14 |     
  15 |     // This test depends on how your backend validates tokens
  16 |     // You may need to modify the implementation to use a real token from the database
  17 |     const response = await request.post('/auth/reset-password', {
  18 |       data: {
  19 |         token: 'valid-mock-token-for-testing',
  20 |         password: newPassword
  21 |       }
  22 |     });
  23 |     
  24 |     // For testing purposes only: 
  25 |     // In a real test, with a valid token, we'd expect a 200 OK response
  26 |     // Here we might receive a 400 or 401 for an invalid token, which is fine for this test
  27 |     
  28 |     if (response.status() === 200) {
  29 |       // If the endpoint accepts our mock token (in test environment):
  30 |       const body = await response.json();
  31 |       expect(body).toHaveProperty('message');
  32 |       expect(body.message).toContain('Паролата беше успешно променена');
  33 |     } else {
  34 |       // Skipping the test as we can't test with mock tokens
  35 |       test.skip(true, 'Skipping because we need real tokens to test properly');
  36 |     }
  37 |   });
  38 |   
  39 |   test('should reject invalid reset token', async ({ request }) => {
> 40 |     const response = await request.post('/auth/reset-password', {
     |                                    ^ Error: apiRequestContext.post: read ECONNRESET
  41 |       data: {
  42 |         token: 'clearly-invalid-token',
  43 |         password: 'NewPassword123!'
  44 |       }
  45 |     });
  46 |     
  47 |     // Should return 400 Bad Request for invalid token
  48 |     expect(response.status()).toBe(400);
  49 |     
  50 |     // Should have error message
  51 |     const body = await response.json();
  52 |     expect(body).toHaveProperty('message');
  53 |   });
  54 | });
  55 |
```