# Test info

- Name: Auth Register API >> should register a new user successfully
- Location: D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\register.spec.ts:5:7

# Error details

```
Error: apiRequestContext.post: read ECONNRESET
Call log:
  - → POST http://localhost:3001/auth/register
    - user-agent: Playwright/1.52.0 (x64; windows 10.0) node/22.13
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - Content-Type: application/json
    - content-length: 102

    at D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\register.spec.ts:11:36
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { generateRandomEmail, generateRandomPassword } from './utils';
   3 |
   4 | test.describe('Auth Register API', () => {
   5 |   test('should register a new user successfully', async ({ request }) => {
   6 |     // Generate test data
   7 |     const email = generateRandomEmail();
   8 |     const password = generateRandomPassword();
   9 |     
  10 |     // Send registration request
> 11 |     const response = await request.post('/auth/register', {
     |                                    ^ Error: apiRequestContext.post: read ECONNRESET
  12 |       data: {
  13 |         email,
  14 |         password,
  15 |         firstName: 'Test',
  16 |         lastName: 'User'
  17 |       }
  18 |     });
  19 |     
  20 |     // Verify response status is 201 Created
  21 |     expect(response.status()).toBe(201);
  22 |     
  23 |     // Verify response body contains user data and access token
  24 |     const body = await response.json();
  25 |     expect(body).toHaveProperty('id');
  26 |     expect(body).toHaveProperty('email', email);
  27 |     expect(body).toHaveProperty('role', 'user'); // assuming default role is 'user'
  28 |     expect(body).toHaveProperty('accessToken');
  29 |     expect(typeof body.accessToken).toBe('string');
  30 |     expect(body.accessToken.length).toBeGreaterThan(20); // JWT token should be reasonably long
  31 |   });
  32 |   
  33 |   test('should return error when registering with invalid data', async ({ request }) => {
  34 |     // Send registration request with invalid email
  35 |     const response = await request.post('/auth/register', {
  36 |       data: {
  37 |         email: 'invalid-email',
  38 |         password: 'Password123!',
  39 |         firstName: 'Test',
  40 |         lastName: 'User'
  41 |       }
  42 |     });
  43 |     
  44 |     // Verify response status is 400 Bad Request
  45 |     expect(response.status()).toBe(400);
  46 |     
  47 |     // Verify response body contains validation error
  48 |     const body = await response.json();
  49 |     expect(body).toHaveProperty('message');
  50 |     expect(Array.isArray(body.message)).toBe(true);
  51 |   });
  52 | });
  53 |
```