# Test info

- Name: Auth Logout API >> should return 401 when not authenticated
- Location: D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\logout.spec.ts:48:7

# Error details

```
Error: apiRequestContext.post: read ECONNRESET
Call log:
  - → POST http://localhost:3001/auth/logout
    - user-agent: Playwright/1.52.0 (x64; windows 10.0) node/22.13
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - Content-Type: application/json

    at D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\logout.spec.ts:50:36
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
  11 | interface LogoutResponse {
  12 |   message: string;
  13 | }
  14 |
  15 | test.describe('Auth Logout API', () => {
  16 |   test('should logout a user successfully', async ({ request }) => {
  17 |     // First register a new user to get an access token
  18 |     const { responseBody } = await registerNewUser(request);
  19 |     const authResponse = responseBody as AuthResponse;
  20 |     const accessToken = authResponse.accessToken;
  21 |     
  22 |     // Send logout request with bearer token
  23 |     const logoutResponse = await request.post('/auth/logout', {
  24 |       headers: {
  25 |         Authorization: `Bearer ${accessToken}`,
  26 |       }
  27 |     });
  28 |     
  29 |     // Verify response status
  30 |     expect(logoutResponse.status()).toBe(200);
  31 |     
  32 |     // Verify response contains logout success message
  33 |     const body = (await logoutResponse.json()) as LogoutResponse;
  34 |     expect(body).toHaveProperty('message');
  35 |     expect(body.message).toContain('Успешно излизане от системата');
  36 |     
  37 |     // Verify token is invalidated by trying to use it again for a protected endpoint
  38 |     const profileResponse = await request.get('/auth/profile', {
  39 |       headers: {
  40 |         Authorization: `Bearer ${accessToken}`,
  41 |       }
  42 |     });
  43 |     
  44 |     // Token should be invalid after logout
  45 |     expect(profileResponse.status()).toBe(401);
  46 |   });
  47 |   
  48 |   test('should return 401 when not authenticated', async ({ request }) => {
  49 |     // Attempt to logout without a token
> 50 |     const response = await request.post('/auth/logout');
     |                                    ^ Error: apiRequestContext.post: read ECONNRESET
  51 |     
  52 |     // Verify unauthorized response
  53 |     expect(response.status()).toBe(401);
  54 |   });
  55 | });
  56 |
```