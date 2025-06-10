# Test info

- Name: Auth Profile API >> should return 401 when not authenticated
- Location: D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\profile.spec.ts:41:7

# Error details

```
Error: apiRequestContext.get: read ECONNRESET
Call log:
  - → GET http://localhost:3001/auth/profile
    - user-agent: Playwright/1.52.0 (x64; windows 10.0) node/22.13
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - Content-Type: application/json

    at D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\profile.spec.ts:42:36
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { registerNewUser } from './utils';
   3 |
   4 | interface AuthResponse {
   5 |   id: number;
   6 |   email: string;
   7 |   role: string;
   8 |   accessToken: string;
   9 | }
  10 |
  11 | interface ProfileResponse {
  12 |   id: number;
  13 |   email: string;
  14 |   role: string;
  15 | }
  16 |
  17 | test.describe('Auth Profile API', () => {
  18 |   test('should get user profile when authenticated', async ({ request }) => {
  19 |     // First register a new user to get an access token
  20 |     const { responseBody } = await registerNewUser(request);
  21 |     const authResponse = responseBody as AuthResponse;
  22 |     const accessToken = authResponse.accessToken;
  23 |     
  24 |     // Send profile request with bearer token
  25 |     const profileResponse = await request.get('/auth/profile', {
  26 |       headers: {
  27 |         Authorization: `Bearer ${accessToken}`,
  28 |       }
  29 |     });
  30 |     
  31 |     // Verify response status is 200 OK
  32 |     expect(profileResponse.status()).toBe(200);
  33 |     
  34 |     // Verify response contains user information
  35 |     const body = (await profileResponse.json()) as ProfileResponse;
  36 |     expect(body).toHaveProperty('id');
  37 |     expect(body).toHaveProperty('email');
  38 |     expect(body).toHaveProperty('role');
  39 |   });
  40 |
  41 |   test('should return 401 when not authenticated', async ({ request }) => {
> 42 |     const response = await request.get('/auth/profile');
     |                                    ^ Error: apiRequestContext.get: read ECONNRESET
  43 |     
  44 |     // Verify unauthorized response
  45 |     expect(response.status()).toBe(401);
  46 |   });
  47 |   
  48 |   test('should return 401 when using invalid token', async ({ request }) => {
  49 |     const response = await request.get('/auth/profile', {
  50 |       headers: {
  51 |         Authorization: 'Bearer invalid-token',
  52 |       }
  53 |     });
  54 |     
  55 |     // Verify unauthorized response
  56 |     expect(response.status()).toBe(401);
  57 |   });
  58 | });
  59 |
```