# Test info

- Name: Auth Reset Password Request API >> should return same response for non-existent email (security feature)
- Location: D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\reset-password-request.spec.ts:26:7

# Error details

```
Error: apiRequestContext.post: read ECONNRESET
Call log:
  - → POST http://localhost:3001/auth/reset-password-request
    - user-agent: Playwright/1.52.0 (x64; windows 10.0) node/22.13
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - Content-Type: application/json
    - content-length: 40

    at D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\reset-password-request.spec.ts:28:36
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { registerNewUser } from './utils';
   3 |
   4 | test.describe('Auth Reset Password Request API', () => {
   5 |   test('should process reset password request for existing user', async ({ request }) => {
   6 |     // First register a new user
   7 |     const { email } = await registerNewUser(request);
   8 |     
   9 |     // Send reset password request
  10 |     const response = await request.post('/auth/reset-password-request', {
  11 |       data: {
  12 |         email
  13 |       }
  14 |     });
  15 |     
  16 |     // Verify response status is 200 OK
  17 |     expect(response.status()).toBe(200);
  18 |     
  19 |     // Verify response contains success message
  20 |     // Note: The message should be generic for security reasons
  21 |     const body = await response.json();
  22 |     expect(body).toHaveProperty('message');
  23 |     expect(body.message).toContain('Ако имейлът съществува');
  24 |   });
  25 |   
  26 |   test('should return same response for non-existent email (security feature)', async ({ request }) => {
  27 |     // Send reset password request for non-existent email
> 28 |     const response = await request.post('/auth/reset-password-request', {
     |                                    ^ Error: apiRequestContext.post: read ECONNRESET
  29 |       data: {
  30 |         email: 'nonexistent-user@example.com'
  31 |       }
  32 |     });
  33 |     
  34 |     // Should still return 200 OK (security feature to prevent user enumeration)
  35 |     expect(response.status()).toBe(200);
  36 |     
  37 |     // Should have same generic message
  38 |     const body = await response.json();
  39 |     expect(body).toHaveProperty('message');
  40 |     expect(body.message).toContain('Ако имейлът съществува');
  41 |   });
  42 | });
  43 |
```