# beelms core – WS-CORE-4 DX & CLI Design (npx create-beelms-app)

_Роля: Architect / Tech Lead / DX. Фаза: BMAD Implementation – WS-CORE-4 (DX/CLI)._  
_Обхват: само дизайн, без реални кодови промени към момента._

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
  - Да са описани стъпките в README как да се създаде нов проект „на ръка“ от този template.
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

Този документ служи като основа за бъдещата реална имплементация на `npx create-beelms-app`, но
сам по себе си не изисква промяна в кода.
