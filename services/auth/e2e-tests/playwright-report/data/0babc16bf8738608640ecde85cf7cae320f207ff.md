# Test info

- Name: Auth Health Check >> health endpoint should return 200 and status ok
- Location: D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\health.spec.ts:4:7

# Error details

```
Error: apiRequestContext.get: read ECONNRESET
Call log:
  - → GET http://localhost:3001/auth/health
    - user-agent: Playwright/1.52.0 (x64; windows 10.0) node/22.13
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - Content-Type: application/json

    at D:\courses\my\QA\project\be\qa-4-free\services\auth\e2e-tests\tests\health.spec.ts:6:36
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Auth Health Check', () => {
   4 |   test('health endpoint should return 200 and status ok', async ({ request }) => {
   5 |     // Send a request to the health check endpoint
>  6 |     const response = await request.get('/auth/health');
     |                                    ^ Error: apiRequestContext.get: read ECONNRESET
   7 |     
   8 |     // Verify response status is 200
   9 |     expect(response.status()).toBe(200);
  10 |     
  11 |     // Verify response body contains status: ok
  12 |     const body = await response.json();
  13 |     expect(body).toHaveProperty('status', 'ok');
  14 |   });
  15 | });
  16 |
```