# Test info

- Name: Auth API >> should get user profile with valid token
- Location: D:\courses\my\QA\project\be\qa-4-free\services\auth\tests\api\auth\auth.spec.ts:100:7

# Error details

```
Error: expect(received).toBeDefined()

Received: undefined
    at D:\courses\my\QA\project\be\qa-4-free\services\auth\tests\api\auth\auth.spec.ts:120:19
```

# Test source

```ts
   20 |   token: string;
   21 | }
   22 |
   23 | interface ErrorResponse {
   24 |   error: string;
   25 |   message?: string | string[];
   26 | }
   27 |
   28 | test.describe('Auth API', () => {
   29 |   let testEmail: string;
   30 |   let authToken: string;
   31 |   
   32 |   test.beforeEach(() => {
   33 |     testEmail = generateTestEmail();
   34 |   });
   35 |   
   36 |   test.afterAll(async ({ request }) => {
   37 |     // Clean up test data after all tests
   38 |     if (authToken) {
   39 |       try {
   40 |         await request.delete('/auth/test/cleanup', {
   41 |           headers: {
   42 |             Authorization: `Bearer ${authToken}`,
   43 |           },
   44 |         });
   45 |       } catch (error) {
   46 |         console.error('Cleanup failed:', error);
   47 |       }
   48 |     }
   49 |   });
   50 |   
   51 |   test('should register a new user', async ({ request }) => {
   52 |     const response = await request.post('/auth/register', {
   53 |       data: {
   54 |         email: testEmail,
   55 |         password: TEST_PASSWORD,
   56 |         firstName: 'Test',
   57 |         lastName: 'User',
   58 |       },
   59 |     });
   60 |     
   61 |     expect(response.status()).toBe(200);
   62 |     const body = await response.json() as AuthResponse;
   63 |     expect(body).toHaveProperty('user');
   64 |     expect(body.user).toHaveProperty('email', testEmail);
   65 |     expect(body).toHaveProperty('token');
   66 |     
   67 |     // Save the token for subsequent requests
   68 |     authToken = body.token;
   69 |   });
   70 |   
   71 |   test('should login with valid credentials', async ({ request }) => {
   72 |     // First, register a test user
   73 |     await request.post('/auth/register', {
   74 |       data: {
   75 |         email: testEmail,
   76 |         password: TEST_PASSWORD,
   77 |         firstName: 'Test',
   78 |         lastName: 'User',
   79 |       },
   80 |     });
   81 |     
   82 |     // Then, test login
   83 |     const response = await request.post('/auth/login', {
   84 |       data: {
   85 |         email: testEmail,
   86 |         password: TEST_PASSWORD,
   87 |       },
   88 |     });
   89 |     
   90 |     expect(response.status()).toBe(200);
   91 |     const body = await response.json() as AuthResponse;
   92 |     expect(body).toHaveProperty('user');
   93 |     expect(body.user).toHaveProperty('email', testEmail);
   94 |     expect(body).toHaveProperty('token');
   95 |     
   96 |     // Save the token for subsequent requests
   97 |     authToken = body.token;
   98 |   });
   99 |   
  100 |   test('should get user profile with valid token', async ({ request }) => {
  101 |     // First, register and login to get a token
  102 |     await request.post('/auth/register', {
  103 |       data: {
  104 |         email: testEmail,
  105 |         password: TEST_PASSWORD,
  106 |         firstName: 'Test',
  107 |         lastName: 'User',
  108 |       },
  109 |     });
  110 |     
  111 |     const loginResponse = await request.post('/auth/login', {
  112 |       data: {
  113 |         email: testEmail,
  114 |         password: TEST_PASSWORD,
  115 |       },
  116 |     });
  117 |     
  118 |     const loginBody = (await loginResponse.json()) as AuthResponse;
  119 |     const { token } = loginBody;
> 120 |     expect(token).toBeDefined();
      |                   ^ Error: expect(received).toBeDefined()
  121 |     
  122 |     // Test getting profile with the token
  123 |     const profileResponse = await request.get('/auth/profile', {
  124 |       headers: {
  125 |         Authorization: `Bearer ${token}`,
  126 |       },
  127 |     });
  128 |     
  129 |     expect(profileResponse.status()).toBe(200);
  130 |     const profile = await profileResponse.json();
  131 |     expect(profile).toHaveProperty('email', testEmail);
  132 |   });
  133 |   
  134 |   test('should return error for invalid credentials', async ({ request }) => {
  135 |     const response = await request.post('/auth/login', {
  136 |       data: {
  137 |         email: 'nonexistent@example.com',
  138 |         password: 'wrongpassword',
  139 |       },
  140 |     });
  141 |     
  142 |     expect(response.status()).toBe(200);
  143 |     const body = (await response.json()) as ErrorResponse;
  144 |     expect(body).toHaveProperty('error');
  145 |   });
  146 |   
  147 |   test('should validate registration data', async ({ request }) => {
  148 |     const response = await request.post('/auth/register', {
  149 |       data: {
  150 |         email: 'invalid-email',
  151 |         password: 'short',
  152 |       },
  153 |     });
  154 |     
  155 |     expect(response.status()).toBe(200);
  156 |     const body = (await response.json()) as ErrorResponse;
  157 |     expect(body).toHaveProperty('error');
  158 |   });
  159 | });
  160 |
```