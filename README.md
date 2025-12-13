# beelms (QA4Free example) – Dev & Local Docker Setup

Това репо съдържа примерна инсталация на core рамката **beelms**, конфигурирана като тренировъчна платформа **QA4Free**:
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
docker compose -f docker-compose.yml -f docker-compose.db-host.yml up -d db
```

- DB ще е достъпен на `localhost:5432` (или друг порт, ако зададеш `DB_PORT_PUBLISHED`) c:
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
npm run dev -- -p 3001
```

- FE слуша на `http://localhost:3001` (виж `package.json` / `next.config.js`).
  Ако искаш друг порт, можеш да го промениш с `npm run dev -- -p <PORT>`.
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

- **db** – Postgres 16 (по подразбиране не е exposed към host)
- **api** – NestJS API на `http://localhost:3000`
- **training-api** – Training API на `http://localhost:4000`

> Ако ти трябва DB достъп от host (psql, локален BE без Docker), ползвай override файла: `docker-compose.db-host.yml`.

> Обърни внимание: `api` услугата се билдва от директорията `be/` чрез `be/Dockerfile`. Ако промениш BE кода, трябва да rebuild-неш контейнера.

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

Това спира `db`, `api` и `training-api` и премахва контейнерите. Volume-ът за Postgres (`db-data`) остава, освен ако не го изтриеш изрично.

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

Това изпълнява `npm run migration:run` вътре в `api` контейнера срещу `qa4free` базата (Postgres контейнер `db`).

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
