# QA4Free – Dev & Local Docker Setup

Това репо съдържа примерна платформа **QA4Free**:
- Next.js frontend (FE)
- NestJS API (BE)
- Training API (отделен NestJS service за упражнения)
- PostgreSQL база данни

Този README описва **как да стартирате проекта за dev** и **как да го стартирате през Docker локално**. Няма инструкции за stage/production – те са извън текущия обхват.

---

## 1. Структура на проекта (накратко)

- `fe/` – Next.js frontend
- `be/` – NestJS backend API (`/api/...`)
- `training-api/` – отделен NestJS service за Training API (`/api/training/...`)
- `docs/` – архитектура, OpenAPI, API примери, DB модел
- `docker-compose.yml` – локална Docker конфигурация за **db + api + training-api**

---

## 2. Dev setup (без Docker) – локално стартиране с hot reload

Този вариант е удобен, когато правите промени по кода (BE/FE) и искате **автоматичен reload**.

### 2.1. Предварителни изисквания

- Node.js LTS (напр. 22.x)
- npm или pnpm (примерите са с npm)
- Локално инсталиран PostgreSQL **или** стартиран `docker-compose` само за db (виж по-долу)

### 2.2. Стартиране на PostgreSQL през Docker (по избор)

Ако нямате локален Postgres, може да ползвате само db услугата от `docker-compose.yml`:

```bash
# В root на репото
docker compose up -d db
```

- DB ще е достъпен на `localhost:5432` c:
  - DB: `qa4free`
  - User: `qa4free`
  - Password: `qa4free`

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

### 2.4. Стартиране на Training API в dev режим

```bash
cd training-api
npm install        # само първия път
npm run start:dev
```

- Training API се стартира на `http://localhost:4000`.
- Примери:
  - `GET http://localhost:4000/api/training/ping`
  - `POST http://localhost:4000/api/training/echo`

### 2.5. Стартиране на FE (Next.js) в dev режим

```bash
cd fe
npm install        # само първия път
npm run dev
```

- FE обикновено слуша на `http://localhost:3001` (виж `package.json` / `next.config.js`).
- В `.env.local` на FE (или по подразбиране) `NEXT_PUBLIC_API_BASE_URL` трябва да сочи към BE:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

Така Admin UI (напр. `/admin/wiki`) ще вика реалните NestJS endpoint-и.

---

## 3. Local Docker setup – db + api + training-api

Този вариант е удобен, когато искаш **бързо да вдигнеш backend-а и базата** без да мислиш за локална инсталация на Postgres и Node версии. FE (Next.js) обикновено се стартира отделно в dev режим.

### 3.1. Стартиране на контейнерите

В root на проекта:

```bash
# Build + start db, api (NestJS) и training-api
docker compose up -d
```

Това стартира три услуги:

- **db** – Postgres 16 на `localhost:5432`
- **api** – NestJS API на `http://localhost:3000`
- **training-api** – Training API на `http://localhost:4000`

> Обърни внимание: `api` услугата се билдва от директорията `be/` чрез `be/Dockerfile`. Ако промениш BE кода, трябва да rebuild-неш контейнера.

### 3.2. Rebuild на BE контейнера след промени по кода

Ако работиш по NestJS кода в `be/` и искаш контейнерът да отразява промените (напр. новия Admin Wiki create endpoint), изпълни:

```bash
docker compose build api
docker compose up -d api
```

Това ще:

- презбилдне image-а за `qa4free-api` от актуалния `be/` код;
- рестартира само `api` услугата.

Алтернативно, с **една** команда можеш да направиш rebuild + start само на `api`:

```bash
docker compose up -d --build api
```

### 3.3. Спиране на контейнерите

```bash
docker compose down
```

Това спира `db`, `api` и `training-api` и премахва контейнерите. Volume-ът за Postgres (`db-data`) остава, освен ако не го изтриеш изрично.

---

## 4. Типични dev комбинации

### 4.1. Всичко локално (Node + Postgres през Docker)

1. Стартирай само Postgres:

   ```bash
   docker compose up -d db
   ```
2. Стартирай BE dev:

   ```bash
   cd be
   npm run start:dev
   ```
3. Стартирай Training API dev (по избор):

   ```bash
   cd training-api
   npm run start:dev
   ```
4. Стартирай FE dev:

   ```bash
   cd fe
   npm run dev
   ```

### 4.2. Всичко през Docker за BE + DB + Training API, FE локално

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
   - или е контейнерът `qa4free-api`, билднат от актуалния код (`docker compose build api`).
2. Увери се, че `GET http://localhost:3000/api/health` връща отговор.
3. Пробвай директно с `curl` към Admin Wiki create endpoint-а (виж `docs/architecture/admin-wiki-api-examples.md`).
4. Ако променяш BE кода и ползваш Docker, не забравяй **rebuild** стъпката от т. 3.2.

---

За по-детайлна документация за API/DB виж:
- `docs/architecture/api-db-docs-index.md` – входна точка към OpenAPI, DB модел и всички `*-api-examples.md`.
