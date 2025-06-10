# Test info

- Name: Auth Login API >> should return 401 when logging in with invalid credentials
- Location: D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\login.spec.ts:30:7

# Error details

```
Error: apiRequestContext.post: read ECONNRESET
Call log:
  - → POST http://localhost:3001/auth/login
    - user-agent: Playwright/1.52.0 (x64; windows 10.0) node/22.13
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - Content-Type: application/json
    - content-length: 68

    at D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\login.spec.ts:32:41
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { registerNewUser } from './utils';
   3 |
   4 | test.describe('Auth Login API', () => {
   5 |   test('should login a user successfully', async ({ request }) => {
   6 |     // First register a new user
   7 |     const { email, password } = await registerNewUser(request);
   8 |     
   9 |     // Send login request with registered credentials
  10 |     const loginResponse = await request.post('/auth/login', {
  11 |       data: {
  12 |         email,
  13 |         password
  14 |       }
  15 |     });
  16 |     
  17 |     // Verify response status is 200 OK
  18 |     expect(loginResponse.status()).toBe(200);
  19 |     
  20 |     // Verify response body contains user data and access token
  21 |     const body = await loginResponse.json();
  22 |     expect(body).toHaveProperty('id');
  23 |     expect(body).toHaveProperty('email', email);
  24 |     expect(body).toHaveProperty('role');
  25 |     expect(body).toHaveProperty('accessToken');
  26 |     expect(typeof body.accessToken).toBe('string');
  27 |     expect(body.accessToken.length).toBeGreaterThan(20);
  28 |   });
  29 |   
  30 |   test('should return 401 when logging in with invalid credentials', async ({ request }) => {
  31 |     // Send login request with invalid credentials
> 32 |     const loginResponse = await request.post('/auth/login', {
     |                                         ^ Error: apiRequestContext.post: read ECONNRESET
  33 |       data: {
  34 |         email: 'nonexistent@example.com',
  35 |         password: 'InvalidPassword123!'
  36 |       }
  37 |     });
  38 |     
  39 |     // Verify response status is 401 Unauthorized
  40 |     expect(loginResponse.status()).toBe(401);
  41 |     
  42 |     // Verify response body contains error message
  43 |     const body = await loginResponse.json();
  44 |     expect(body).toHaveProperty('message');
  45 |   });
  46 | });
  47 |
```