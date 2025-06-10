# Test info

- Name: Auth Reset Password Request API >> should process reset password request for existing user
- Location: D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\reset-password-request.spec.ts:5:7

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

    at registerNewUser (D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\utils.ts:40:34)
    at D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\reset-password-request.spec.ts:7:44
```

# Test source

```ts
   1 | /**
   2 |  * Utility functions for auth service e2e tests
   3 |  */
   4 | import { APIRequestContext, APIResponse } from '@playwright/test';
   5 |
   6 | export interface AuthResponse {
   7 |   id: number;
   8 |   email: string;
   9 |   role: string;
  10 |   accessToken: string;
  11 | }
  12 |
  13 | export interface ApiResponse<T> {
  14 |   response: APIResponse;
  15 |   responseBody: T;
  16 |   email: string;
  17 |   password: string;
  18 | }
  19 |
  20 | // Generate a random email address for testing
  21 | export function generateRandomEmail(): string {
  22 |   const randomString = Math.random().toString(36).substring(2, 10);
  23 |   return `test-${randomString}@example.com`;
  24 | }
  25 |
  26 | // Generate a random password for testing
  27 | export function generateRandomPassword(): string {
  28 |   return `Password${Math.floor(Math.random() * 1000000)}`;
  29 | }
  30 |
  31 | // Register a new user and return response details
  32 | export async function registerNewUser(
  33 |   request: APIRequestContext,
  34 |   email?: string,
  35 |   password?: string,
  36 | ): Promise<ApiResponse<AuthResponse>> {
  37 |   const userEmail = email || generateRandomEmail();
  38 |   const userPassword = password || generateRandomPassword();
  39 |   
> 40 |   const response = await request.post('/auth/register', {
     |                                  ^ Error: apiRequestContext.post: read ECONNRESET
  41 |     data: {
  42 |       email: userEmail,
  43 |       password: userPassword,
  44 |       firstName: 'Test',
  45 |       lastName: 'User',
  46 |     },
  47 |   });
  48 |   
  49 |   const responseBody = (await response.json()) as AuthResponse;
  50 |   return { response, responseBody, email: userEmail, password: userPassword };
  51 | }
  52 |
  53 | // Login a user and return response details
  54 | export async function loginUser(
  55 |   request: APIRequestContext,
  56 |   email: string,
  57 |   password: string,
  58 | ): Promise<ApiResponse<AuthResponse>> {
  59 |   const response = await request.post('/auth/login', {
  60 |     data: {
  61 |       email,
  62 |       password,
  63 |     },
  64 |   });
  65 |   
  66 |   const responseBody = (await response.json()) as AuthResponse;
  67 |   return { response, responseBody, email, password };
  68 | }
  69 |
```