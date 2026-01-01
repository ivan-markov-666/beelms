# beelms – Dev & Local Docker Setup

Това репо съдържа примерна инсталация на core рамката **beelms**:
- Next.js frontend (FE)
- NestJS API (BE)
- PostgreSQL база данни

Този README описва **как да стартирате проекта за dev** и **как да го стартирате през Docker локално**. Няма инструкции за stage/production – те са извън текущия обхват.

---

## 0. Статус и текущ фокус

- 2025-12-30: Завършен **Deep Audit Pass #7** – BE ↔ OpenAPI, backlog ↔ story specs и FE routes са синхронизирани. `STORY-TASKS-1` е маркиран като ✅ Implemented. Следващ фокус: автоматизиране на OpenAPI синка (STORY-DOCS-1).

---

## 1. Структура на проекта (накратко)

- `fe/` – Next.js frontend
- `be/` – NestJS backend API (`/api/...`)
- `docs/` – архитектура, OpenAPI, API примери, DB модел
- `docker-compose.yml` – локална Docker конфигурация за **db + api**

---

## 1.1. DB migrations & seed (quick commands)

Команди от root на репото (wrapper-и към `be/`):

```bash
# Migration run/check/show/revert
npm run be:migration:run
npm run be:migration:check
npm run be:migration:show
npm run be:migration:revert

# OpenAPI
npm run docs:openapi:lint

# Seed (dev, без build)
npm run be:seed:dev

# Seed (compiled, изисква `npm --prefix be run build` ако се пуска от host)
npm run be:seed:wiki
npm run be:seed:courses
```

---

## 2. Dev setup (без Docker) – локално стартиране с hot reload

Този вариант е удобен, когато правите промени по кода (BE/FE) и искате **автоматичен reload**.

### 2.x. Команди от root директорията (npm --prefix)

Можеш да стартираш скриптовете за BE/FE директно от root на репото, без да влизаш в папките:

```bash
# BE
npm --prefix be run build
npm --prefix be run start:dev

# FE
npm --prefix fe run build
npm --prefix fe run dev -- -p 3001
```

### 2.1. Предварителни изисквания

- Node.js LTS (напр. 22.x)
- npm или pnpm (примерите са с npm)
- Локално инсталиран PostgreSQL **или** стартиран `docker-compose` само за db (виж по-долу)

### 2.2. Стартиране на PostgreSQL през Docker (по избор)

Ако нямате локален Postgres, може да ползвате само db услугата от `docker-compose.yml`:

```bash
# В root на репото
docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db
```

- DB ще е достъпен на `localhost:5432` (или друг порт, ако зададеш `DB_PORT_PUBLISHED`) c:
  - DB: `beelms`
  - User: `beelms`
  - Password: `beelms`

### 2.3. Стартиране на BE (NestJS API) в dev режим

```bash
cd be
npm install        # само първия път
npm run start:dev  # NestJS с --watch и hot reload
```

- API се стартира на `http://localhost:3000`.
- Всички пътища са под `/api`, защото в `main.ts` има `app.setGlobalPrefix('api')`.
  - Примери:
    - `GET http://localhost:3000/api/health`
    - `POST http://localhost:3000/api/auth/login`
    - `POST http://localhost:3000/api/admin/wiki/articles`

> Ако променяте BE кода и стартирате през `npm run start:dev`, **няма нужда** от ръчен `npm run build` – NestJS сам компилира при промени.

### 2.4. Стартиране на FE (Next.js) в dev режим

```bash
cd fe
npm install        # само първия път
npm run dev -- -p 3001
```

- FE слуша на `http://localhost:3001` (виж `package.json` / `next.config.js`).
  Ако искаш друг порт, можеш да го промениш с `npm run dev -- -p <PORT>`.
- В `.env.local` на FE (или по подразбиране) `NEXT_PUBLIC_API_BASE_URL` трябва да сочи към BE:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

#### 2.4.1.1. API URL helper (frontend)

- **Никога не конкатенирай `/api` ръчно.** Вместо това използвай споделения helper `fe/src/app/api-url.ts`.
- `getApiBaseUrl()` връща нормализираната стойност (гарантира, че завършва на `/api`, дори env да е без него).
- `buildApiUrl("/auth/login")` добавя пътя със сигурен водещ `/`.
- Това означава, че компонентите/страниците просто викат:

  ```ts
  import { buildApiUrl } from "../api-url";
  await fetch(buildApiUrl("/auth/login"), { ... });
  ```

- В репото има Jest guard, който фейлва, ако се появи директна употреба на `NEXT_PUBLIC_API_BASE_URL` извън `api-url.ts`.

#### 2.4.1.2. CAPTCHA / reCAPTCHA (anti-bot) – env vars

CAPTCHA е имплементирана като **Google reCAPTCHA (v2 checkbox)**.

- FE (`fe/.env.local`):

```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key

# (по избор) DEV bypass ако reCAPTCHA script-ът е блокиран локално.
# Работи само когато NODE_ENV != production.
NEXT_PUBLIC_RECAPTCHA_DEV_BYPASS=true
```

- BE (`be/.env` / env на процеса):

```bash
RECAPTCHA_SECRET_KEY=your_secret_key

# включва captcha изискване за /auth/register и /auth/forgot-password
AUTH_REQUIRE_CAPTCHA=true

# включва captcha изискване за /users/me/export
ACCOUNT_EXPORT_REQUIRE_CAPTCHA=true

# (по избор) изисква captcha при /auth/login след N неуспешни опита (default 3)
AUTH_LOGIN_CAPTCHA_THRESHOLD=3

# по избор: dev bypass на външната проверка към Google
CAPTCHA_VERIFY_DISABLED=true
```

Notes:

- В **dev/test** среда BE не прави реална HTTP верификация към Google (за да не блокира локалната работа), но когато `AUTH_REQUIRE_CAPTCHA=true` / `ACCOUNT_EXPORT_REQUIRE_CAPTCHA=true` се изисква да се подаде **непразен** `captchaToken`.
- В **production** (`NODE_ENV=production`) BE валидира `captchaToken` чрез `https://www.google.com/recaptcha/api/siteverify`.
- `AUTH_LOGIN_CAPTCHA_THRESHOLD` контролира след колко неуспешни login опита (за комбинацията `ip+email`) FE ще поиска CAPTCHA и BE ще започне да изисква `captchaToken`.
- В `NODE_ENV=test` login CAPTCHA е изключена по подразбиране (за да не влияе на e2e тестовете). Ако е нужно да се тества изрично, може да се включи с `AUTH_LOGIN_CAPTCHA_TEST_MODE=true`.
- Ако reCAPTCHA widget не се визуализира локално, най-честата причина е блокиране на `recaptcha/api.js` от adblock/Brave shields/корпоративна мрежа. FE пробва и fallback домейн `https://www.recaptcha.net/recaptcha/api.js`.

#### 2.4.1. Stripe payments (Paid courses) – env vars

За да работи Stripe checkout flow за paid courses (STORY-PAYMENTS-1):

- FE (`fe/.env.local`):

```bash
NEXT_PUBLIC_STRIPE_PAYMENTS=true
```

- BE (`be/.env` / env на процеса):

```bash
STRIPE_SECRET_KEY=sk_test_...
FRONTEND_ORIGIN=http://localhost:3001
STRIPE_COURSE_PRICE_CENTS=999
```

Notes:

- `STRIPE_SECRET_KEY` трябва да е test mode secret key от Stripe.
- `FRONTEND_ORIGIN` се ползва за success/cancel redirect URL-и.
- `STRIPE_COURSE_PRICE_CENTS` е fallback цена (ако няма per-course pricing и няма `payment_settings`).

Така Admin UI (напр. `/admin/wiki`) ще вика реалните NestJS endpoint-и.

#### 2.4.2. Google OAuth (Login/Register with Google) – env vars

За STORY-AUTH-5 (Google социален login) трябва да създадеш **OAuth 2.0 Client** в [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Тип “Web application”.
2. Добави `http://localhost:3000` (BE) и `http://localhost:3001` (FE) като **Authorized JavaScript origins** в dev.
3. Добави `http://localhost:3000/api/auth/google/callback` като **Authorized redirect URI** (същият URL трябва да влезе и в `GOOGLE_OAUTH_REDIRECT_URL`).

След това попълни новите BE env променливи (в `be/.env` или секретния ви мениджър):

```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_REDIRECT_URL=http://localhost:3000/api/auth/google/callback
```

Tip: `FRONTEND_ORIGIN` трябва да сочи към FE URL (примерно `http://localhost:3001`), за да може backend-ът да редиректне потребителя обратно след `/auth/google/callback`.

Проверка, че конфигурацията работи (без още да имаме FE бутон):

1. `npm --prefix be run start:dev`
2. `curl "http://localhost:3000/api/auth/google/authorize"` – отговорът съдържа `url` и `state`.
3. Отвори върнатия `url` в браузър, завърши Google consent flow → backend редиректва към `FRONTEND_ORIGIN/auth/social-callback?...`.

---

## 3. Local Docker setup – db + api

Този вариант е удобен, когато искаш **бързо да вдигнеш backend-а и базата** без да мислиш за локална инсталация на Postgres и Node версии. FE (Next.js) обикновено се стартира отделно в dev режим.

### 3.1. Стартиране на контейнерите

В root на проекта:

```bash
# Build + start db и api (NestJS)
docker compose up -d
```

Това стартира услугите:

- **db** – Postgres 16 (по подразбиране не е exposed към host)
- **migrate** – one-off контейнер, който прилага TypeORM миграции
- **api** – NestJS API на `http://localhost:3000`

> Ако ти трябва DB достъп от host (psql, локален BE без Docker), ползвай override файла: `docker-compose.db-host.yml`.

> Обърни внимание: `api` услугата се билдва от директорията `be/` чрез `be/Dockerfile`. Ако промениш BE кода, трябва да rebuild-неш контейнера.

### 3.1.1. Docker dev workflow (cheatsheet)

Команди от root (еквивалентни `npm run docker:*` wrapper-и също са налични в `package.json`):

```bash
# Start DB+migrations+API
docker compose up -d

# Stop containers (keep volumes)
docker compose down

# Stop + delete volumes (fresh DB)
docker compose down -v

# Rebuild только API container след промени в `be/`
docker compose up -d --build api

# Run migrations explicitly (one-off)
docker compose run --rm migrate

# Seed data (Wiki/Courses)
docker compose exec api npm run seed:wiki
docker compose exec api npm run seed:courses

# Opt-in DB host access (publish DB port)
docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db
```

### 3.2. Rebuild на BE контейнера след промени по кода

Ако работиш по NestJS кода в `be/` и искаш контейнерът да отразява промените (напр. новия Admin Wiki create endpoint), изпълни:

```bash
docker compose build api
docker compose up -d api
```

Това ще:

- презбилдне image-а за `api` услугата от актуалния `be/` код (виж `docker-compose.yml`);
- рестартира само `api` услугата.

Алтернативно, с **една** команда можеш да направиш rebuild + start само на `api`:

```bash
docker compose up -d --build api
```

### 3.3. Спиране на контейнерите

```bash
docker compose down
```

Това спира `db` и `api` и премахва контейнерите. Volume-ът за Postgres (`db-data`) остава, освен ако не го изтриеш изрично.

### 3.4. Миграции на базата (TypeORM + Docker)

Схемата на базата за BE се управлява с TypeORM миграции, конфигурирани в `be/data-source.ts`.
Миграциите се създават локално (на хоста), а най-често се изпълняват през `api` контейнера.

#### Генериране на нова миграция (пример: добавяне на нова колона)

1. Увери се, че Postgres (`db` service) върви:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db
   ```

2. От папка `be/` генерирай миграция според променения код (entities):

   ```bash
   cd be
   npm run typeorm -- migration:generate src/migrations/AddSomethingDescriptive
   ```

   Това създава нов `.ts` файл в `be/src/migrations/` (име с таймстемп).

3. По желание – commit-вай миграционните файлове в Git заедно с промяната по entity-тата.

#### Пускане на миграциите през Docker (стандартен път)

Обичайният workflow за apply на всички pending миграции към Docker базата е:

1. Увери се, че контейнерите са билднати/пуснати:

   ```bash
   docker compose up -d db api
   ```

2. Пусни всички чакащи миграции **с една команда**:

   ```bash
   docker compose exec api npm run migration:run
   ```

Това изпълнява `npm run migration:run` вътре в `api` контейнера срещу `beelms` базата (Postgres контейнер `db`).

#### Комбинирана команда: миграции + Wiki seed (по избор)

За локален setup, след промени по схемата, често искаме и да seed-нем Wiki:

```bash
docker compose exec api sh -c "npm run migration:run && npm run seed:wiki"
```

Това:
- прилага всички миграции;
- пуска `seed:wiki` (идемпотентен; може да се вика многократно).

---

## 4. Типични dev комбинации

### 4.1. Всичко локално (Node + Postgres през Docker)

1. Стартирай само Postgres:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db
   ```
2. Стартирай BE dev:

   ```bash
   cd be
   npm run start:dev
   ```
3. Стартирай FE dev:

   ```bash
   cd fe
   npm run dev
   ```

### 4.2. Всичко през Docker за BE + DB, FE локално

1. В root:

   ```bash
   docker compose up -d
   ```

2. Стартирай FE dev (локално):

   ```bash
   cd fe
   npm run dev
   ```

Увери се, че `NEXT_PUBLIC_API_BASE_URL` във FE сочи към `http://localhost:3000/api`.

---

## 5. Debug на проблеми като 404 на Admin Wiki create

Ако FE вика `POST http://localhost:3000/api/admin/wiki/articles`, но получаваш `404 Not Found`:

1. Провери, че BE, който върви на `3000`, е
   - или стартиран с `npm run start:dev` в `be/`,
   - или е `api` услугата от Docker Compose, билдната от актуалния код (`docker compose build api`).
2. Увери се, че `GET http://localhost:3000/api/health` връща отговор.
3. Пробвай директно с `curl` към Admin Wiki create endpoint-а (виж `docs/architecture/admin-wiki-api-examples.md`).
4. Ако променяш BE кода и ползваш Docker, не забравяй **rebuild** стъпката от т. 3.2.

---

За по-детайлна документация за API/DB виж:
- `docs/architecture/api-db-docs-index.md` – входна точка към OpenAPI, DB модел и всички `*-api-examples.md`.

---

## 6. WS-CORE-4 CLI scaffold и локален "бедняшки CI"

В това репо има експериментален CLI прототип за scaffold на нов beelms core проект:

- пакет: `tools/create-beelms-app/`
- команда (локално):
  - `node tools/create-beelms-app/dist/index.js my-lms`
  - `node tools/create-beelms-app/dist/index.js my-lms --api-only`

CLI-то създава структура от вида:

```text
my-lms/
  api/    # NestJS backend (копие на be/)
  web/    # Next.js frontend (копие на fe/, по избор)
  docker/ # docker-compose.yml + DX helper скриптове
  env/    # място за .env.example файлове
  README.md
```

### 6.1. Локален "бедняшки CI" (BE + FE + CLI)

Препоръчителен ритуал преди по-големи промени/merge към `main`:

- Backend:
  - `cd be`
  - `npm run test:regression:local`
- Frontend:
  - `cd fe`
  - `npm run test`
- CLI + Docker smoke (по желание, напр. преди release):
  - `cd tools/create-beelms-app`
  - `npm run smoke`

Подробности и примерни git `pre-push` hook-ове (Windows / Linux/macOS) има в:

- `docs/LOCAL_CI.md`
