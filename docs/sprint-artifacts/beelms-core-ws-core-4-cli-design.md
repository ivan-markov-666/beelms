# beelms core – WS-CORE-4 DX & CLI Design (npx create-beelms-app)

_Роля: Architect / Tech Lead / DX. Фаза: BMAD Implementation – WS-CORE-4 (DX/CLI)._  
_Обхват: дизайн + локален прототип в това репо (CLI, Docker walking skeleton, regression tests)._ 

## 1. Цел и позициониране на WS-CORE-4

WS-CORE-4 има за цел да даде **бърз старт за нов beelms core проект** чрез CLI команда
`npx create-beelms-app`, която:

- генерира базов **backend** (NestJS) scaffold, съвместим с архитектурата на beelms core;
- по избор добавя **frontend** scaffold (Next.js), който може да стъпи на вече реализираните
  вертикали (Wiki, Auth, Admin);
- добавя минимален **Docker Compose** стек и `.env` примерни файлове (съвместими с Lean Tier 0);
- улеснява включването на вече реализираните walking skeleton-и WS-CORE-1..3.

CLI-то не е отделен продукт, а **DX слой** над вече дефинирания архитектурен и модулен модел на
beelms core.

Свързани артефакти:

- Sprint Planning – `docs/sprint-artifacts/beelms-core-sprint-planning.md`
- Sprint Status – `docs/sprint-artifacts/beelms-core-sprint-status.yaml`
- Architecture – `docs/architecture/beelms-core-architecture.md`
- Test Design – `docs/testing/beelms-core-test-design.md`
- EPIC/STORY Map – `docs/backlog/beelms-core-epics-and-stories.md`

---

## 2. Основни DX сценарии

### 2.1. Създаване на нов beelms core проект

**Сценарий:**

- Разработчик изпълнява:
  - `npx create-beelms-app my-lms`
- CLI-то задава няколко ключови въпроса (интерактивно или чрез флагове):
  - Тип проект:
    - `api-only` (само NestJS backend)
    - `full-stack` (NestJS + Next.js)
  - Избор на package manager за локалния scaffold (npm/pnpm/yarn)
  - Желана базова езикова локализация (напр. `bg` по подразбиране)
- Резултат:
  - Създадена е папка `my-lms/` със следната високо‑ниво структура (примерно):
    - `api/` – NestJS приложение (beelms core backend)
    - `web/` – Next.js приложение (опционално)
    - `docker/` – Docker Compose и свързани файлове
    - `env/` – `.env.example` файлове по среди
    - `README.md` – кратки инструкции за стартиране

### 2.2. Минимален стек за локален старт

**Сценарий:**

- Разработчикът влиза в `my-lms/` и изпълнява:
  - `docker compose up -d` (или еквивалентен скрипт от README-то)
- Очакван резултат:
  - backend + Postgres (и по избор frontend) са стартирани с минимална конфигурация;
  - базовите vertical-и (Wiki, Auth, Admin dashboard) могат да се активират с минимална настройка
    (миграции/seed, конфиг на admin потребител и т.н.).

### 2.3. DX за повторна генерация/ъпдейти (out of scope за първа версия)

В по‑късен етап CLI-то може да поддържа:

- добавяне на нови модули към съществуващ проект (напр. `beelms add practical-lab`);
- генериране на примерни тестове, GitHub Actions и др.

За първата версия на WS-CORE-4 тези сценарии са **out of scope**, но е важно да са отчетени в
архитектурния дизайн.

---

## 3. Изходна структура на проекта (високо ниво)

> Забележка: това е **логическа** структура. Конкретните файлове/имена може да се уточнят при
> реалната имплементация.

### 3.1. Корен на новия проект

- `my-lms/`
  - `api/` – NestJS backend
  - `web/` – Next.js frontend (по избор)
  - `docker/` – Docker Compose конфигурации
  - `env/` – `.env.example` по среди (dev/test/prod или dev/local)
  - `README.md` – как да се стартира стекът локално
  - евентуално `Makefile` или `package.json` на корен ниво за DX скриптове

### 3.2. Backend scaffold (api/)

Основна цел: **минимален, но съвместим с beelms core** NestJS проект, в който може да се активират:

- модулите за Wiki, Auth, Admin (или техни опростени версии);
- базова интеграция с Postgres (TypeORM или еквивалент); 
- конфигурируеми `env` стойности (JWT, DB и т.н.).

Примерни поддиректории (логически):

- `api/src/app.module.ts` – root модул, който импортира core модулите (Wiki, Auth, Admin);
- `api/src/config/` – конфигурационни helper-и (зареждане на env, DB config);
- `api/src/modules/wiki/` – място за Wiki модула;
- `api/src/modules/auth/` – място за Auth;
- `api/src/modules/admin/` – място за Admin dashboard/metrics;
- `api/src/common/` – споделени филтри, guard-ове, DTO-та.

За първата версия CLI-то може да стъпва директно на **копиране на вече съществуващ beelms core
backend scaffold** (или subset от него), вместо да генерира всичко от нула.

### 3.3. Frontend scaffold (web/)

Ако потребителят избере `full-stack` вариант:

- `web/` съдържа Next.js приложение с базова навигация:
  - публично `/wiki` + `/wiki/[slug]` (WS-CORE-1);
  - `/auth/login`, `/auth/register` (WS-CORE-2);
  - `/admin` dashboard (WS-CORE-3), евентуално с feature flag.
- конфигурация към `NEXT_PUBLIC_API_BASE_URL` (насочена към backend от docker-compose).

CLI-то трябва да може да включи/изключи `web/` scaffold според избрания template.

### 3.4. Docker и среди (docker/, env/)

- `docker/docker-compose.yml` – базов Lean Tier 0 стек: 
  - `api`, `db` (Postgres), по избор `web`;
- `env/.env.example.api`, `env/.env.example.web`, `env/.env.example.db` – примерни конфигурации;
- README секция „Бърз старт с Docker Compose“.

Това съответства на вече дефинираната в архитектурата Lean Tier 0 стратегия.

---

## 4. Връзка с WS-CORE-1..3 и EPIC/STORY картата

CLI scaffold-ът трябва да създаде проект, в който:

- **WS-CORE-1 (Wiki)** може да бъде активиран с минимални стъпки:
  - миграции за Wiki таблици;
  - seed на примерни статии;
  - готови Next.js страници (ако е избран full-stack template).
- **WS-CORE-2 (Auth + Wiki)** може да бъде конфигуриран:
  - env стойности за JWT/crypto;
  - базова registration/login функционалност с пренасочване към `/wiki`.
- **WS-CORE-3 (Admin Dashboard)**:
  - API endpoints за admin metrics и users да са налични;
  - `/admin` UI да работи срещу тези endpoints.

Mapping към EPIC/STORY карта (високо ниво):

- EPIC-CORE-DX-CLI-INFRA → 
  - Story: „Като dev искам `npx create-beelms-app` да ми създава нов beelms core проект“;
  - Story: „Като dev искам да мога да избера api-only или full-stack template“;
  - Story: „Като dev искам готов Docker Compose и `.env.example` файлове за бърз старт“.

---

## 5. Фазиране на WS-CORE-4 (итерации без кодови детайли)

### 5.1. Итерация 1 – Prototype (S3 scope)

- Цели:
  - Да има ръчно подготвен template (в рамките на monorepo-то), от който CLI-то по‑късно може да
    копира структурата.
  - Да са описани стъпките в README как да се създаде нов проект „на ръка“ от този template
    (виж `docs/sprint-artifacts/beelms-core-ws-core-4-manual-template.md`).
- За тази итерация може да се приеме, че CLI-то все още не съществува – имаме само **документиран
  и ръчно повторяем процес**, описан тук и/или в отделен README.

### 5.2. Итерация 2 – Initial CLI (S3/S4 граница)

- Цели:
  - Реализиране на `npx create-beelms-app`, което автоматизира ръчните стъпки от Итерация 1.
  - Поддържани опции:
    - име на проекта (`my-lms`);
    - template: `api-only` или `full-stack`.
- Изискване: CLI командата да може да бъде публикувана като npm пакет (или да работи чрез
  `npx` от GitHub registry), но детайлите за публикуване могат да са последващ етап.

### 5.3. Итерация 3 – DX подобрения (S4+)

- По‑добра интеграция с tooling:
  - auto‑генерирани npm/pnpm скриптове за често срещани действия (migrate, seed, test, lint);
  - шаблони за CI workflows (GitHub Actions, др.);
  - интеграция с test design (примерни smoke тестове).

Тези елементи са **извън целта на първоначалния S3 scope**, но са важни за бъдещ DX roadmap.

---

## 6. Критерии за `Done` на WS-CORE-4 (в контекста на S3)

WS-CORE-4 може да се счита за "достатъчен" в рамките на S3, когато:

- Съществува ясно описан и повторяем процес (документиран тук и/или в отделен README) за създаване
  на нов beelms core проект, който включва:
  - backend scaffold, съвместим с архитектурата;
  - по избор frontend scaffold;
  - Docker Compose + `.env.example` файлове;
- Има планирана и описана структура на CLI командата и нейните опции (дори преди реалната
  имплементация);
- Sprint артефактите (`beelms-core-sprint-planning.md` и `beelms-core-sprint-status.yaml`) са
  синхронизирани и ясно показват:
  - кои части на WS-CORE-4 са реализирани;
  - кои остават за следващи спринтове (S4+).

---

## 7. Локално използване на create-beelms-app (CLI прототип)

За целите на DX и експериментиране WS-CORE-4 има **локален CLI прототип** в това репо:

- път: `tools/create-beelms-app/`
- език: TypeScript (`src/index.ts` → `dist/index.js`)

### 7.1. Build на CLI-то

1. От корена на CLI пакета:

   ```bash
   cd tools/create-beelms-app
   npm install
   npm run build
   ```

   Това генерира `dist/index.js`, който се използва както от `bin`, така и от ръчни тестове.

### 7.2. Стартиране на CLI прототипа

От директорията, в която искаш да се създаде новият проект (напр. `d:\Projects`):

```bash
cd d:\Projects
node .\qa-4-free\tools\create-beelms-app\dist\index.js my-lms
```

По избор може да се създаде **API-only** проект (без `web/` scaffold):

```bash
cd d:\Projects
node .\qa-4-free\tools\create-beelms-app\dist\index.js my-lms --api-only
```

Резултат (логическа структура):

```text
my-lms/
  api/    # NestJS backend template (копие на be/)
  web/    # Next.js frontend template (копие на fe/)
  docker/ # docker-compose.yml, генериран от CLI-то (api + db stack)
  env/    # празна папка за .env.example файлове
  README.md
```

Този прототип автоматизира ръчния процес от `beelms-core-ws-core-4-manual-template.md` и служи
като база за бъдещата публична `npx create-beelms-app` команда.

### 7.3. Walking skeleton: CLI → Docker → regression tests (пример с `my-lms-test`)

Текущият WS-CORE-4 прототип вече покрива не само генериране на файлове, но и **пълен walking
skeletal flow** за нов проект:

1. **Scaffold с CLI**
   - Команда (пример):

     ```bash
     cd d:\testing-cli
     node d:\Projects\qa-4-free\tools\create-beelms-app\dist\index.js my-lms-test
     ```

   - Резултат: структура тип

     ```text
     my-lms-test/
       api/      # NestJS backend (копие на be/)
       web/      # Next.js frontend (копие на fe/, по избор)
       docker/   # docker-compose.yml, генериран динамично (api + db)
       env/      # празна папка за .env.example
       README.md # кратки инструкции
     ```

2. **Docker walking skeleton (API + DB)**
   - В `my-lms-test/docker/docker-compose.yml` CLI-то генерира стек с project-specific имена и
     портове (пример: `my-lms-test-api` на `localhost:3001`, `my-lms-test-db` на `localhost:5433`).
   - Старт на стека:

     ```bash
     cd d:\testing-cli\my-lms-test\my-lms-test\docker
     docker compose up --build
     ```

   - След стартиране:
     - `/api/health` отговаря на `http://localhost:3001/api/health`;
     - `/api/wiki/articles` връща 500, докато няма миграции/seed (очаквано поведение).

3. **Миграции и Wiki seed за новата база**
   - При стартиране на чист стек DB е празна (липсват `wiki_articles`, `users`).
   - Миграции и seed се пускат **вътре в API контейнера** на новия проект:

     ```bash
     cd d:\testing-cli\my-lms-test\my-lms-test\docker
     docker compose exec api npm run migration:run
     docker compose exec api npm run seed:wiki
     ```

   - След това:
     - `GET http://localhost:3001/api/wiki/articles` → `200 OK` с seed‑нати статии;
     - Auth flow (`/api/auth/register`, `/api/auth/login`) работи срещу новата DB `my_lms_test`.

4. **Integration / regression tests**
   - Backend scaffold-ът в `api/` наследява тестовите скриптове от `be/`:
     - `npm run test` – unit тестове;
     - `npm run test:e2e` – e2e срещу DB;
     - `npm run test:perf` – HTTP‑only integration/perf script (`scripts/e2e-auth-account-perf.js`);
     - `npm run test:setup-db` – DX helper за `build + migration:run + seed:wiki` към избраната DB;
     - `npm run test:regression:local` – DX helper, който пуска `test:setup-db`, `test` и `test:e2e` (без perf).
   - В контекста на Docker за новия проект regression пакетът може да се пусне директно:

     ```bash
     cd d:\testing-cli\my-lms-test\my-lms-test\docker
     docker compose exec api npm run test:regression
     ```

   - или чрез **one-shot DX скриптите**, които CLI-то генерира в `docker/`:

     ```bash
     # Linux/macOS
     ./docker-test-regression-local.sh

     # Windows
     docker-test-regression-local.bat
     ```

     Тези скриптове изпълняват `docker compose up --build -d` и след това
     `docker compose exec api npm run test:regression:local` (т.е. migrations + seed + unit + e2e).

   - Това служи като **автоматизиран check**, че walking skeleton‑ът работи не само в
     оригиналния QA4Free проект, а и в ново scaffold‑нато beelms core приложение.

5. **Забележка за текущия POC**
   - В POC проекта `my-lms-test` има един известен unit тест mismatch (Wiki admin versions тестът
     не очаква новите полета `status` и `subtitle`). Това не блокира walking skeleton‑а и може да
     бъде оправено или чрез леко обновяване на теста в POC‑а, или автоматично за бъдещи проекти
     след фикса в изходния `be/` модул.

Тази 7.3 секция описва **минималния, но реално проверен** WS-CORE-4 walking skeleton: от CLI
scaffold през Docker стек до автоматизирани regression тестове.

---

## 8. DX backlog към v0.1.0 (стабилизиране на CLI-то)

Следните задачи оформят минимален DX backlog, преди CLI-то да се счита стабилно за по-широка
употреба (v0.1.0), без да се променя драстично структурата на генерирания проект:

- **8.1. UX на CLI командата**
  - Ясни флагове/параметри (напр. `--name`, `--template`, `--api-port`, `--db-port`).
  - Валидация и смислени съобщения при грешки (несъществуващ път, непразна директория,
    неподдържана Node версия и др.).

- **8.2. README и quickstart в генерирания проект**
  - Автоматично генериран `README.md` в корена на новия проект с:
    - стъпки за `docker compose up`;
    - команди за миграции/seed;
    - примери за `npm run test:regression` (в контейнера и от хоста).

- **8.3. Консистентни npm скриптове**
  - Уеднаквяване на ключови скриптове в `api/package.json` на генерирания проект:
    - `migration:run`, `seed:wiki`, `test`, `test:e2e`, `test:perf`, `test:regression`.
  - По желание – добавяне на helper скриптове на проектно ниво (напр. `docker:test:regression`).
  - **Статус (прототип):** частично реализирано чрез `test:setup-db`, `test:regression:local` и
    генерираните `docker-test-regression-local.sh/.bat` в `docker/`.
  - Автоматизиран тест/скрипт в monorepo-то, който:
    - пуска CLI-то в temp директория;
    - вдига Docker стека за новия проект;
    -
  - **Статус (v0.1.0):** реализирано като `tools/create-beelms-app/src/smoke.ts` + `npm run smoke`,
    който билдва CLI-то, scaffold-ва временен проект, стартира Docker стека и пуска
    `npm run test:regression:local` в `api` контейнера.

- **8.5. Versioning и changelog**
  - Въвеждане на семантично versioning за CLI-то (напр. `v0.1.0` за първата стабилна DX версия).
  - Кратък changelog (дори като Markdown секция), описващ breaking промени за генерираните проекти.
  - **Статус (v0.1.0):** добавен е коренен `CHANGELOG.md` с entry за DX/CLI baseline `v0.1.0`.
    Все още няма публично npm publish / семантично versioning за самия CLI пакет.

Този backlog е умишлено кратък и насочен към "stability surface" на CLI-то – структура на
генерирания проект, основни команди и основен walking skeleton (CLI → Docker → regression tests).

---

## 9. Real state vs plan (DX baseline v0.1.0)

### 9.1. Какво е реализирано към v0.1.0

- **Локален CLI прототип в monorepo-то** (`tools/create-beelms-app`):
  - scaffold-ва структура `api/`, по избор `web/`, `docker/`, `env/` и `README.md`;
  - поддържа `--api-only` / `--no-web` флаг за backend-only проекти.
- **Docker + DX helper-и в генерирания проект**:
  - динамично генериран `docker/docker-compose.yml` с project-specific имена/портове;
  - DX скриптове `docker-test-regression-local.sh/.bat`, които пускат Docker стек +
    `npm run test:regression:local` в `api` контейнера.
- **Уеднаквени BE тест скриптове** в шаблона (`test:setup-db`, `test:regression:local`) и
  FE Jest конфигурация с mock-ове за markdown зависимостите.
- **Локален "бедняшки CI" ритуал** описан в `docs/LOCAL_CI.md` + примерни git `pre-push` hook-ове
  за BE/FE тестове и CLI smoke.
- **Smoke тест за CLI** (`npm run smoke`), който валидира walking skeleton-а
  **CLI → scaffold → Docker → regression tests** в temp директория.
- **Changelog** на корен ниво (`CHANGELOG.md`) с entry за DX/CLI baseline `v0.1.0`.

### 9.2. Какво остава за следващи итерации (S4+)

- Публикуване на CLI-то като отделен npm пакет, така че `npx create-beelms-app` да работи
  извън това репо.
- По-богат UX на CLI командата:
  - интерактивни въпроси и по-изразителни флагове (портове, имена на услуги, избор на модули);
  - по-детайлни съобщения при грешки и валидация на средата.
- Разширяване на scaffolding-а за среди и CI:
  - auto-генерация на `.env.example` по среди (не само празна `env/` дирекция);
  - готови CI шаблони (напр. GitHub Actions) за BE/FE/CLI smoke.
- Следващи DX подобрения около добавяне на нови модули ("add module" команди),
  интеграция с тестовия design и по-богат documentation scaffolding.
