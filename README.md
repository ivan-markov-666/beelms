# beelms – Dev & Local Docker Setup

> **Under Active Development**  
> **What the system already have:** BeeLMS is a full-stack LMS platform powered by **NestJS** (backend API) and **Next.js** (frontend). The MVP build is ~90% complete and we plan to ship a stable release by the end of **February 2026**.

## Core capabilities (current MVP)

- **Admin settings & branding** – customize app name, colors, favicon, fonts, themes, social links, live previews and SEO helpers.
- **Courses & content** – public/private courses, paid courses with Stripe / PayPal, wiki modules and system pages (Terms, Privacy, FAQ, etc.).
- **Authentication & security** – email/password login, social sign-ins (Google/Facebook/GitHub/LinkedIn), CAPTCHA protections and admin-managed OAuth credentials.
- **Payments & automation** – Stripe webhooks, PayPal Orders API, sandbox tooling for admins, automated seed/migration scripts.
- **Localization & accessibility** – multi-language support, accessibility widget, responsive UI and SSR rendering for key screens.
- **DevOps tooling** – docker-compose for API/DB, CLI scaffolding for new instances, OpenAPI docs and a local “poor man’s CI” (BE+FE test suites).

This repo hosts a reference installation of the **beelms** core stack:
- Next.js frontend (`fe/`)
- NestJS API (`be/`)
- PostgreSQL database

The README explains how to run the project locally (dev mode and Docker). Stage/production guides are out of scope for now.

---

## 0. Status & current focus

- 2025‑12‑30: Completed **Deep Audit Pass #7** – BE ↔ OpenAPI, backlog ↔ story specs and FE routes are synchronized. `STORY-TASKS-1` is ✅ Implemented. Next focus: automate the OpenAPI sync (STORY-DOCS-1).

---

## 1. Project structure (overview)

- `fe/` – Next.js frontend
- `be/` – NestJS backend API (`/api/...`)
- `docs/` – architecture, OpenAPI specs, API examples, DB model
- `docker-compose.yml` – local Docker setup for **db + api**

---

## 1.1. DB migrations & seed (quick commands)

Run from repository root (wrappers to scripts in `be/`):

```bash
# Migration run/check/show/revert
npm run be:migration:run
npm run be:migration:check
npm run be:migration:show
npm run be:migration:revert

# OpenAPI lint
npm run docs:openapi:lint

# Seed (dev, no build)
npm run be:seed:dev

# Seed (compiled; requires `npm --prefix be run build` if triggered from host)
npm run be:seed:wiki
npm run be:seed:courses
```

---

## 2. Dev setup (without Docker) – local hot reload

Ideal when editing BE/FE code and you want automatic reloads.

### 2.x. Root-level commands (npm --prefix)

You can run BE/FE scripts directly from the repo root:

```bash
# Backend
npm --prefix be run build
npm --prefix be run start:dev

# Frontend
npm --prefix fe run build
npm --prefix fe run dev -- -p 3001
```

### 2.1. Prerequisites

- Node.js LTS (e.g., 22.x)
- npm or pnpm (examples use npm)
- Local PostgreSQL **or** Docker Compose (DB-only) – see below

### 2.2. Start PostgreSQL via Docker (optional)

If you don’t have Postgres installed locally, spin up only the DB service:

```bash
# In repo root
docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db
```

- DB will listen on `localhost:5432` (or `DB_PORT_PUBLISHED` if overridden):
  - DB: `beelms`
  - User: `beelms`
  - Password: `beelms`

### 2.3. Run BE (NestJS API) in dev mode

```bash
cd be
npm install        # first time only
npm run start:dev  # NestJS with --watch + hot reload
```

- API runs on `http://localhost:3000`.
- All routes are prefixed with `/api` (`app.setGlobalPrefix('api')` in `main.ts`):
  - `GET http://localhost:3000/api/health`
  - `POST http://localhost:3000/api/auth/login`
  - `POST http://localhost:3000/api/admin/wiki/articles`

> When using `npm run start:dev`, there is **no need** to run `npm run build`; NestJS re-compiles automatically.

### 2.4. Run FE (Next.js) in dev mode

```bash
cd fe
npm install        # first time only
npm run dev -- -p 3001
```

- FE listens on `http://localhost:3001` (see `package.json` / `next.config.js`).
- Change the port with `npm run dev -- -p <PORT>` if needed.
- In `fe/.env.local`, ensure `NEXT_PUBLIC_API_BASE_URL` points to the BE:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

#### 2.4.1. API URL helper (frontend)

- **Never** concatenate `/api` manually. Use `fe/src/app/api-url.ts`.
- `getApiBaseUrl()` normalizes the base (always ends with `/api`).
- `buildApiUrl("/auth/login")` prepends the path safely.
- Components/pages simply do:

  ```ts
  import { buildApiUrl } from "../api-url";
  await fetch(buildApiUrl("/auth/login"), { ... });
  ```

- Jest guard ensures `NEXT_PUBLIC_API_BASE_URL` is not used directly outside `api-url.ts`.

#### 2.4.2. CAPTCHA / reCAPTCHA (anti-bot) – env vars

We use **Google reCAPTCHA v2 checkbox**.

- FE (`fe/.env.local`):

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key

# optional dev bypass if the script is blocked locally
NEXT_PUBLIC_RECAPTCHA_DEV_BYPASS=true
```

- BE (`be/.env`):

```bash
RECAPTCHA_SECRET_KEY=your_secret_key
AUTH_REQUIRE_CAPTCHA=true            # /auth/register, /auth/forgot-password
ACCOUNT_EXPORT_REQUIRE_CAPTCHA=true  # /users/me/export
AUTH_LOGIN_CAPTCHA_THRESHOLD=3       # request CAPTCHA after N failed logins
CAPTCHA_VERIFY_DISABLED=true         # optional dev bypass for Google verification
```

Notes:

- In **dev/test**, BE skips the external Google verification but still requires a non-empty `captchaToken` if the feature flags are true.
- In **production**, BE verifies via `https://www.google.com/recaptcha/api/siteverify`.
- `AUTH_LOGIN_CAPTCHA_THRESHOLD` controls the IP+email failure count before FE asks for CAPTCHA.
- In `NODE_ENV=test`, login CAPTCHA is disabled by default (can be re-enabled with `AUTH_LOGIN_CAPTCHA_TEST_MODE=true`).
- If the widget is missing locally, check blockers (adblock, Brave shields, corporate proxies). FE will also try `https://www.recaptcha.net/recaptcha/api.js`.

### 2.5. Stripe payments (paid courses) – env vars

#### 2.5.1. Payments (Stripe / PayPal) – how it works

- **Payment provider configuration** (keys, sandbox/live) is server-side via BE env vars.
- **Admin → Payments → Sandbox** is UI tooling to generate test checkout URLs; it is not a separate mode.
- Stripe sandbox vs live depends on using `sk_test_...` / `sk_live_...` and matching webhook secrets.
- PayPal sandbox vs live depends on `PAYPAL_MODE=sandbox|live` + credentials.

Stripe checkout flow (STORY-PAYMENTS-1):

- FE (`fe/.env.local`):

```bash
NEXT_PUBLIC_STRIPE_PAYMENTS=true
```

- BE (`be/.env`):

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_ORIGIN=http://localhost:3001
STRIPE_COURSE_PRICE_CENTS=999
```

Notes:

- `STRIPE_SECRET_KEY` must be a test secret key for dev.
- `STRIPE_WEBHOOK_SECRET` signs incoming webhook events.
- `FRONTEND_ORIGIN` configures success/cancel redirect URLs.
- `STRIPE_COURSE_PRICE_CENTS` is the fallback price if per-course pricing is absent.

##### Stripe webhook (required for automatic unlock)

- Dev webhook URL: `http://localhost:3000/api/payments/webhook`
- Suggested dev workflow:
  - `stripe login`
  - `stripe listen --forward-to http://localhost:3000/api/payments/webhook`
  - Copy the CLI-provided `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
- Production: configure the dashboard webhook to `https://<api-host>/api/payments/webhook` and copy the secret.

##### Stripe testing flow (dev)

1. Ensure `paidCourses` feature is on.
2. Configure currency/price via Admin → Payments (or keep defaults).
3. Open a paid course, press “Enroll/Buy”.
4. User is redirected to Stripe Checkout.
5. After success, user lands on `/courses/:courseId/checkout/success?session_id=...`; FE waits for the webhook to persist the purchase and enrolls the student.

### 2.6. PayPal payments – env vars

PayPal integration uses the **Orders API** (create → approve → capture).

- FE (`fe/.env.local`):

```bash
NEXT_PUBLIC_PAYPAL_PAYMENTS=true
NEXT_PUBLIC_PAYMENT_PROVIDER=paypal   # default is “stripe” if omitted
```

- BE (`be/.env`):

```bash
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
FRONTEND_ORIGIN=http://localhost:3001
```

Notes:

- `PAYPAL_MODE=sandbox` uses `https://api-m.sandbox.paypal.com`; `live` uses `https://api-m.paypal.com`.
- `FRONTEND_ORIGIN` controls return/cancel URLs:
  - success: `/courses/:courseId/checkout/paypal/success?token=...`
  - cancel: `/courses/:courseId/checkout/paypal/cancel`

##### PayPal testing flow (dev)

1. Ensure `PAYPAL_MODE=sandbox` and a sandbox REST app exists.
2. Set `NEXT_PUBLIC_PAYPAL_PAYMENTS=true` and `NEXT_PUBLIC_PAYMENT_PROVIDER=paypal`.
3. Start a paid course checkout; you’ll be redirected to PayPal approval.
4. After approval, PayPal redirects back to `/checkout/paypal/success?token=...`.
5. FE calls `POST /api/courses/:courseId/paypal/verify` (capture + persist) and then enrolls when status is complete.

##### Admin → Payments → PayPal → Sandbox tooling

- Shortcut for admins to generate approval URLs via `POST /api/courses/:courseId/checkout?provider=paypal`.
- Useful for debugging without going through the full course UI.

### 2.7. Google OAuth (login/register) – env vars

For STORY-AUTH-5:

1. Create an **OAuth 2.0 Client** in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (type “Web application”).
2. Add `http://localhost:3000` (BE) and `http://localhost:3001` (FE) as **Authorized JavaScript origins**.
3. Add `http://localhost:3000/api/auth/google/callback` as an **Authorized redirect URI** (same value goes into `GOOGLE_OAUTH_REDIRECT_URL`).

Populate BE env vars (`be/.env`):

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_REDIRECT_URL=http://localhost:3000/api/auth/google/callback
```

Tip: `FRONTEND_ORIGIN` must point to the FE so BE can redirect back after `/auth/google/callback`.

Validation steps (without a dedicated FE button yet):

1. `npm --prefix be run start:dev`
2. `curl "http://localhost:3000/api/auth/google/authorize"` – returns `{ url, state }`.
3. Open the URL, complete consent, BE redirects to `FRONTEND_ORIGIN/auth/social-callback?...`.

> ⚠️ **Important:** Starting January 2026, OAuth credentials live in DB (`instance_config.social_credentials`) and are managed via admin UI. Env vars only act as initial fallback; once admins save values, DB overrides them. Secrets are never returned to clients.

### 2.8. Admin management of social credentials (Google/Facebook/GitHub/LinkedIn)

1. Log in as admin → `/admin/settings`.
2. In **“OAuth Credentials”** you’ll find cards per provider:
   - Enter **Client ID** and **Redirect URL** (e.g., `http://localhost:3000/api/auth/google/callback`).
   - Add a **new client secret** if needed (sent once, never shown again).
   - Use “Delete stored secret” to nullify credentials (e.g., rotation).
3. After clicking **Save**:
   - BE validates and stores values in `instance_config.social_credentials`.
   - OAuth services read from DB and fallback to env vars only if missing.
   - “Configured” status updates based on actual stored secrets/IDs.

> Secrets never appear in API responses; UI only gets a `hasClientSecret` flag so admins know if a secret exists.

---

## 3. Local Docker setup – db + api

Great for quickly running backend + database without managing local Postgres/Node installations. FE (Next.js) typically runs locally in dev mode.

### 3.1. Start containers

```bash
# Build + start db and api (NestJS)
docker compose up -d
```

Services:

- **db** – Postgres 16 (not exposed to host by default)
- **migrate** – one-off container applying TypeORM migrations
- **api** – NestJS API at `http://localhost:3000`

> Need DB access from host (psql/local BE)? Use `docker-compose.db-host.yml` override.

> Remember: `api` builds from `be/Dockerfile`. After backend code changes, rebuild the container.

### 3.1.1. Docker dev workflow (cheatsheet)

Root-level commands (mirrored by `npm run docker:*` in `package.json`):

```bash
# Start DB + migrations + API
docker compose up -d

# Stop containers (keep volumes)
docker compose down

# Stop + delete volumes (fresh DB)
docker compose down -v

# Rebuild API container after code changes
docker compose up -d --build api

# Run migrations manually
docker compose run --rm migrate

# Seed data (Wiki/Courses)
docker compose exec api npm run seed:wiki
docker compose exec api npm run seed:courses

# Publish DB port to host
docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db
```

### 3.2. Rebuild API container after code changes

```bash
docker compose build api
docker compose up -d api
```

This rebuilds the `api` image from the latest `be/` code and restarts only that service.

Shortcut (rebuild + start):

```bash
docker compose up -d --build api
```

### 3.3. Stop containers

```bash
docker compose down
```

This stops `db` and `api`, removing containers but keeping the Postgres volume (`db-data`) unless you explicitly delete it.

### 3.4. Database migrations (TypeORM + Docker)

BE schema is managed via TypeORM migrations configured in `be/data-source.ts`. Migrations are created locally but often executed inside the `api` container.

#### Generate a migration (example: new column)

1. Ensure Postgres (`db` service) is running:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db
   ```

2. From `be/`, generate migration based on updated entities:

   ```bash
   cd be
   npm run typeorm -- migration:generate src/migrations/AddSomethingDescriptive
   ```

   This creates a timestamped file in `be/src/migrations/`.

3. Commit migration files together with entity changes if desired.

#### Run migrations via Docker (standard path)

1. Ensure containers are built/running:

   ```bash
   docker compose up -d db api
   ```

2. Apply all pending migrations with one command:

   ```bash
   docker compose exec api npm run migration:run
   ```

This executes `npm run migration:run` inside the `api` container against the `beelms` database.

#### Combined command: migrations + Wiki seed (optional)

```bash
docker compose exec api sh -c "npm run migration:run && npm run seed:wiki"
```

- Applies all migrations.
- Seeds the Wiki (idempotent; safe to run multiple times).

---

## 4. Typical dev combos

### 4.1. Everything local (Node) + Postgres via Docker

1. Start Postgres only:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db
   ```
2. Start BE dev:

   ```bash
   cd be
   npm run start:dev
   ```
3. Start FE dev:

   ```bash
   cd fe
   npm run dev
   ```

### 4.2. Docker for BE + DB, FE locally

1. In repo root:

   ```bash
   docker compose up -d
   ```

2. Start FE dev locally:

   ```bash
   cd fe
   npm run dev
   ```

Ensure `NEXT_PUBLIC_API_BASE_URL` points to `http://localhost:3000/api`.

---

## 5. Debugging issues like 404 on Admin Wiki create

If FE calls `POST http://localhost:3000/api/admin/wiki/articles` and gets `404 Not Found`:

1. Verify BE on port 3000 is either:
   - running via `npm run start:dev` in `be/`, or
   - the Docker `api` service built from current code (`docker compose build api`).
2. Check `GET http://localhost:3000/api/health`.
3. Curl the Admin Wiki endpoint directly (see `docs/architecture/admin-wiki-api-examples.md`).
4. If using Docker, remember to rebuild the API container after code changes (section 3.2).

---

For deeper API/DB documentation see:
- `docs/architecture/api-db-docs-index.md` – entry point for OpenAPI, DB model, `*-api-examples.md`, etc.

---

## 6. WS-CORE-4 CLI scaffold & local “poor man’s CI”

This repo includes an experimental CLI prototype for scaffolding new BeeLMS core instances:

- Package: `tools/create-beelms-app/`
- Commands (local):
  - `node tools/create-beelms-app/dist/index.js my-lms`
  - `node tools/create-beelms-app/dist/index.js my-lms --api-only`

CLI output structure:

```text
my-lms/
  api/    # NestJS backend (copy of be/)
  web/    # Next.js frontend (copy of fe/, optional)
  docker/ # docker-compose.yml + DX helper scripts
  env/    # folder for .env.example files
  README.md
```

### 6.1. Local “poor man’s CI” (BE + FE + CLI)

Suggested routine before large changes/merges to `main`:

- Backend:
  - `cd be`
  - `npm run test:regression:local`
- Frontend:
  - `cd fe`
  - `npm run test`
- CLI + Docker smoke (optional, e.g., pre-release):
  - `cd tools/create-beelms-app`
  - `npm run smoke`

See `docs/LOCAL_CI.md` for more details and sample git `pre-push` hooks (Windows / Linux / macOS).
