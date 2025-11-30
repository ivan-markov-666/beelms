<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
npm install
```

## Compile and run the project (local, without Docker)

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Dockerized development environment

The QA4Free backend is primarily intended to run in Docker together with a PostgreSQL database.

From the project root (`d:\Projects\qa-4-free`):

```bash
docker compose up --build
```

This starts:

- a Postgres 16 instance (service `db`) with:
  - `DB_NAME = qa4free`
  - `DB_USER = qa4free`
  - `DB_PASSWORD = qa4free`
- the NestJS API (service `api`) on port `3000`.

Health check:

```bash
curl http://localhost:3000/api/health
```

Expected response: `OK`.

## Database migrations

Migrations are managed with TypeORM and are executed **inside the API container**.

From the project root:

```bash
docker compose exec api npm run migration:run
```

This applies all pending migrations against the `qa4free` database.

You can also run migrations directly from the host (if you have a local Postgres instance that matches the Docker configuration):

```bash
cd be
npm run migration:run
```

## Wiki seed data

The Wiki feature requires initial seed data so that the walking skeleton can work with real articles.

After migrations have been applied, run the Wiki seed inside the API container:

```bash
docker compose exec api npm run seed:wiki
```

This will insert:

- an `active` article with slug `getting-started` with BG and EN versions;
- an `active` article with slug `faq` with a BG version;
- an `active` article with slug `qa4free-overview` with BG and EN versions (high-level overview of the QA4Free platform).

The seed script is idempotent and can be safely executed multiple times.

You can also run the seed script directly from the host (again, assuming a reachable Postgres instance with the same credentials). In this case you must first build the project so that the compiled seed file exists:

```bash
cd be
npm run build
npm run seed:wiki
```

## Wiki public API (WS-1)

After migrations and the Wiki seed have been applied, the following public endpoints are available for the walking skeleton and MVP Wiki extensions:

- `GET /api/wiki/articles` – returns a list of active Wiki articles.
  - Optional query params:
    - `page`, `pageSize` – pagination (defaults: `page = 1`, `pageSize = 20`).
    - `q` – optional search query applied to article titles.
    - `lang` – optional language filter for the latest published version (e.g. `bg`, `en`).
- `GET /api/wiki/articles/{slug}` – returns a single active Wiki article by slug.
  - Optional query param: `lang` (e.g. `bg`, `en`).

Example requests (assuming Docker compose is running on `localhost:3000`):

```bash
curl http://localhost:3000/api/wiki/articles

curl "http://localhost:3000/api/wiki/articles/getting-started?lang=bg"

curl "http://localhost:3000/api/wiki/articles?q=Начало&lang=bg"

# Explicit pagination (page 2, page size 10) combined with filters
curl "http://localhost:3000/api/wiki/articles?q=Начало&lang=bg&page=2&pageSize=10"
```

## Auth API (WS-2)

The Auth service implements the WS-2 walking skeleton for registration and login. The main public endpoints are:

- `POST /api/auth/register`
  - Request body: `{ "email": string, "password": string, "captchaToken?": string }`.
  - On success, returns `201 Created` with a `UserProfile` object: `{ id, email, createdAt }`.
  - On error, returns `409` for duplicate email or `400` for validation errors. Passwords are never returned in responses.
- `POST /api/auth/login`
  - Request body: `{ "email": string, "password": string }`.
  - On success, returns `200 OK` with an `AuthToken` object: `{ accessToken, tokenType: "Bearer" }`.
  - On error, returns `401 Unauthorized` with a generic "invalid credentials" message.

- `POST /api/auth/forgot-password`
  - Request body: `{ "email": string, "captchaToken?": string }`.
  - When the email exists, the backend generates a cryptographically secure reset token with a validity of 24 hours and stores it on the user record. In the WS-2 walking skeleton, the reset link is **logged in the API logs in non-production environments** instead of sending a real email.
  - When the email does not exist, the endpoint still returns `200 OK` with the same generic success shape (non-enumeration).
  - On validation errors (invalid email, missing CAPTCHA when required) returns `400`.

- `POST /api/auth/reset-password`
  - Request body: `{ "token": string, "newPassword": string }`.
  - On success (`200 OK`):
    - validates that the token exists and is not expired (24-hour TTL);
    - updates the user's bcrypt password hash;
    - invalidates the token (one-time use) by clearing the stored token and expiry.
  - On error (`400`): invalid or expired token, or invalid new password according to the same policy as registration.

- `POST /api/auth/verify-email`
  - Request body: `{ "token": string }`.
  - On success (`200 OK`):
    - when the token matches `emailVerificationToken` on a user and is not expired, marks the user's email as verified and clears the token fields;
    - when the token matches `pendingEmailVerificationToken` and is not expired, applies the pending email change (`email` becomes `pendingEmail`), clears the pending fields and ensures the email is marked as verified, subject to the email change verification limit described below.
  - On error:
    - `400` – invalid or expired verification token;
    - `429` – the user has already completed 3 email change verifications in the last 24 hours (`"email change verification limit reached"`).

### Auth configuration

The Auth module is configured via environment variables:

- `JWT_SECRET` – secret key used to sign JWT access tokens (default for local dev: `dev_jwt_secret_change_me`).
- `JWT_EXPIRES_IN` – access token lifetime, e.g. `900s` or `15m` (default: `900s`).
- `AUTH_REQUIRE_CAPTCHA` – when set to `true`, the `POST /api/auth/register` and `POST /api/auth/forgot-password` endpoints require a non-empty `captchaToken` field in the request body.
 - `FRONTEND_ORIGIN` – origin allowed by CORS for browser clients (default: `http://localhost:3001`), used by `app.enableCors` in `be/src/main.ts`.

### Account / Profile API (WS-2)

All account endpoints are protected with JWT and are available under the `/api/users` prefix (the global Nest prefix is `api`). A valid access token from `POST /api/auth/login` must be sent as:

`Authorization: Bearer <accessToken>`

The main endpoints are:

- `GET /api/users/me`
  - Returns the current user's profile.
  - Response body: `{ id, email, createdAt, emailChangeLimitReached, emailChangeLimitResetAt }` where:
    - `emailChangeLimitReached: boolean` – whether the 3-per-24h email change verification limit has been reached for the current user;
    - `emailChangeLimitResetAt: string | null` – ISO timestamp indicating when the 24-hour window will reset (non-null only when the limit is currently reached).
  - Errors: `401` when the JWT is missing/invalid.

- `PATCH /api/users/me`
  - Updates basic profile information (currently only `email`).
  - Request body: `{ email: string }`.
  - Behaviour:
    - when the new email is the same as the current one, returns the current profile unchanged;
    - when the new email is different and free, sets `pendingEmail` and generates a verification token with a 24-hour TTL for the new address; the primary `email` remains unchanged until `/api/auth/verify-email` is called with the pending token;
    - in non-production environments, the verification link for the new email is logged to the API logs instead of sending a real email.
  - Success: `200 OK` with the current profile `{ id, email, createdAt }` (where `email` is still the old value until verification completes).
  - Errors:
    - `400` for invalid email format.
    - `409` when the new email is already used by another active account.

- `POST /api/users/me/change-password`
  - Changes the current user's password.
  - Request body: `{ currentPassword: string, newPassword: string }` where `newPassword` must be at least 8 characters (same rules as registration).
  - Success: `200 OK` with an empty body; the stored bcrypt hash is updated.
  - Errors:
    - `400` when the current password is wrong or the new password does not meet the policy.
    - `401` when the JWT is missing/invalid.

- `DELETE /api/users/me`
  - Deactivates the current account (soft delete for WS-2 by setting `active = false` and anonymizing personal data such as the email and password hash, so the original email can be re-used for a new account in line with GDPR).
  - Success: `204 No Content`.
  - After deletion:
    - `GET /api/users/me` with the old access token returns `401` (the token is no longer accepted).
    - `POST /api/auth/login` with the same credentials returns `401`.

- `POST /api/users/me/export`
  - Returns a minimal export of the current user's personal data.
  - Request body: `{ captchaToken?: string }`.
  - Success: `200 OK` with `{ id, email, createdAt, active }`.
  - Errors:
    - `400` when CAPTCHA is required but missing.
    - `401` when the JWT is missing/invalid.

The export endpoint is additionally controlled via:

- `ACCOUNT_EXPORT_REQUIRE_CAPTCHA` – when set to `true`, `POST /api/users/me/export` requires a non-empty `captchaToken` field. This mirrors the behaviour of `AUTH_REQUIRE_CAPTCHA` for registration.

#### GDPR data lifecycle (internal)

Internally, the Auth/Account services maintain additional timestamps on the `User` entity to support GDPR lifecycle and audit use cases:

- `createdAt` – user creation time (existing field).
- `passwordLastChangedAt` – last time the password was set or changed (updated on registration, password reset, and change-password).
- `gdprErasureRequestedAt` / `gdprErasureCompletedAt` – when account erasure/anonymisation was requested and completed (set during `DELETE /api/users/me`).
- `lastExportRequestedAt` / `lastExportDeliveredAt` – when a personal data export was requested and delivered (set during `POST /api/users/me/export`).

These fields are **not exposed in the public WS-2 Auth/Account API responses** and are intended for internal reporting and future admin/audit tooling.

#### Token revocation (internal)

For security, JWT access tokens embed a `tokenVersion` value derived from the `User` entity. On each authenticated request, the `JwtAuthGuard`:

- verifies the JWT signature;
- loads the user by `sub` from the database;
- checks that the user is active and that `payload.tokenVersion === user.tokenVersion`.

This means that:

- after `POST /api/users/me/change-password`, the user's `tokenVersion` is incremented and all previously issued tokens become invalid across all protected endpoints;
- after `DELETE /api/users/me`, the user is marked inactive and any existing tokens for that user are rejected with `401 Unauthorized`.

This mechanism is internal and does not change the public Auth API shapes (the login response remains `{ accessToken, tokenType }`).

For full request/response schemas, see the OpenAPI spec in `docs/architecture/openapi.yaml`.

### Manual testing checklist – Auth + Account (WS-2)

1. Start the backend and database (see Docker instructions above) and apply migrations/seed.
2. Register a new user via `POST /api/auth/register`.
3. Login via `POST /api/auth/login` and copy the returned `accessToken`.
4. Call `GET /api/users/me` with `Authorization: Bearer <accessToken>` and verify the profile.
5. Call `PATCH /api/users/me` to request an email change:
   - inspect the API logs (in non-production) or the `users` table to obtain the `pendingEmailVerificationToken` for the test user;
   - call `POST /api/auth/verify-email` with `{ "token": "<PENDING_EMAIL_TOKEN>" }`;
   - call `GET /api/users/me` again and verify that the `email` field now reflects the new value.
6. Call `POST /api/users/me/export` and verify the exported payload (and CAPTCHA behaviour when `ACCOUNT_EXPORT_REQUIRE_CAPTCHA=true`).
7. Call `POST /api/users/me/change-password` and verify that logging in with the old password fails, while the new password works.
8. Call `DELETE /api/users/me` and verify that `GET /api/users/me` with the old access token returns `401` and `POST /api/auth/login` with the same credentials returns `401`.

### Example curl requests (local dev)

Assuming the backend is running on `http://localhost:3000` and CAPTCHA is required for registration and export:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123","captchaToken":"dummy-captcha"}'

# Login (note the accessToken from the response)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'

# Get current profile
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"

# Update email
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"email":"new-email@example.com"}'

# Change password
curl -X POST http://localhost:3000/api/users/me/change-password \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Password123","newPassword":"NewPassword456"}'

# Export personal data
curl -X POST http://localhost:3000/api/users/me/export \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"captchaToken":"dummy-captcha"}'

# Delete account
curl -X DELETE http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Run tests

```bash
# unit tests
npm run test

# e2e tests (require a running PostgreSQL instance and applied migrations/seed)
npm run test:e2e

# test coverage
npm run test:cov

# regression suite (unit + e2e + perf)
npm run test:regression

# performance test only (Auth + Account HTTP-only flow)
npm run test:perf
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
