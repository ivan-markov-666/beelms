# beelms core – Sprint Planning & Walking Skeletons (Phase 3)

_Роля: Tech Lead / Architect / PM. Фаза: BMAD Implementation – Sprint Planning._

## 1. Цел и контекст

Този документ описва **първоначалния план за спринтове и walking skeleton-и** за имплементацията на
**beelms core** (рамката), стъпвайки върху:

- Product Brief – `docs/product/product-brief.md`
- PRD – `docs/product/prd.md`
- Brainstorm – `docs/backlog/brainstorm-beelms-core.md`
- Technical Research – `docs/analysis/research/technical-self-hosted-lms-architecture-research-2025-12-10.md`
- UX Design – `docs/ux-design-specification.md`
- System Architecture – `docs/architecture/beelms-core-architecture.md`
- EPIC & Story Map – `docs/backlog/beelms-core-epics-and-stories.md`
- Test Design – `docs/testing/beelms-core-test-design.md`
- Implementation Readiness – `docs/delivery/beelms-core-implementation-readiness.md`

Фокусът е върху **core рамката**, не върху конкретна инстанция (QA4Free и др.). Конкретни продукти
върху beelms ще имат свои собствени sprint планове.

---

## 2. Guiding принципи за спринтовете

- **Walking skeleton first** – първите спринтове изграждат тесни, но реални end-to-end вертикали
  (FE + API + DB + tooling), вместо да се работи "по слоеве".
- **Simple first** – спринтовете са малки и фокусирани; избягваме прекомерно много паралелни EPIC-и.
- **Core reuse** – каквото бъде изградено за beelms core, трябва да може да се преизползва от
  бъдещи инстанции.
- **Testable increments** – всеки спринт завършва с нещо, което може да бъде smoke тествано според
  Test Design документа.

---

## 3. Предложени Walking Skeleton-и за beelms core

### WS-CORE-1 – Guest → Wiki List → Wiki Article (Core Wiki Vertical)

**Цел:**

- Да валидираме базовия стек (Next.js + NestJS + PostgreSQL) и content модела (Wiki), стъпвайки
  на EPIC-CORE-WIKI-CONTENT.

**Обхват:**

- FE: `/wiki` (списък със статии), `/wiki/[slug]` (детайл на статия).
- API: `GET /api/wiki/articles`, `GET /api/wiki/articles/{slug}`.
- DB: базови таблици за статии и версии, seed с няколко примерни статии.

Свързани EPIC/STORY елементи (от `beelms-core-epics-and-stories.md`):

- EPIC-CORE-WIKI-CONTENT – основни stories за публичен списък и детайл на статия.

### WS-CORE-2 – Guest → Register/Login → View Wiki (Core Auth + Wiki integration)

**Цел:**

- Да свържем Auth & Accounts с Wiki, така че регистрирани потребители да могат да се логнат и да
  използват Wiki, стъпвайки на EPIC-CORE-AUTH-ACCOUNTS + EPIC-CORE-WIKI-CONTENT.

**Обхват:**

- FE: `/register`, `/login`, basic header/login state, redirect към `/wiki`.
- API: основните auth endpoints (register/login), JWT сесия, `GET /api/users/me`.

Свързани EPIC/STORY елементи:

- EPIC-CORE-AUTH-ACCOUNTS – stories за register/login и базов профил.
- EPIC-CORE-WIKI-CONTENT – вече изграден vertical от WS-CORE-1.

### WS-CORE-3 – Admin Dashboard & Basic Settings

**Цел:**

- Да даде вертикал за Admin, който вижда базови метрики (брой потребители, статии) и може да
  управлява основни настройки, стъпвайки на EPIC-CORE-ADMIN-PORTAL и EPIC-CORE-CROSS-METRICS.

**Обхват:**

- FE: `/admin` Dashboard (+ базова навигация към Wiki/Admin секциите).
- API: `GET /api/admin/metrics/overview`, базови admin endpoints за списък с потребители/статии.

Свързани EPIC/STORY елементи:

- EPIC-CORE-ADMIN-PORTAL – admin dashboard и управление на съдържание/потребители.
- EPIC-CORE-CROSS-METRICS – базова метрика "брой регистрирани потребители".

### WS-CORE-4 – DX & CLI – `npx create-beelms-app`

**Цел:**

- Да имаме минимален working scaffold, който да може да се ползва и от други инстанции за старт.

**Обхват:**

- CLI команда `npx create-beelms-app`, която:
  - създава backend проект (NestJS core структури);
  - по избор създава frontend (Next.js) проект;
  - добавя docker-compose файлове и примерни `.env` файлове;
  - включва базовите модули, реализирани в предишните WS-CORE-1..3.

Свързани EPIC/STORY елементи:

- EPIC-CORE-DX-CLI-INFRA – stories за CLI scaffold, docker-compose стек, миграции/seed.
  - Детайлен DX/CLI дизайн – `docs/sprint-artifacts/beelms-core-ws-core-4-cli-design.md`.

---

## 4. Предложен план за първите 3 спринта (примерен)

> Забележка: броят спринтове и продължителността им зависят от реалния капацитет. Тук фокусираме
> съдържанието, не календара.

### Sprint 1 – WS-CORE-1 (Core Wiki Vertical)

**Фокус:**

- Изграждане на базовия стек и публичната Wiki вертикала.

**Основни цели:**

- Работещи `/wiki` и `/wiki/[slug]` през Next.js.
- REST API за списък и детайл на статии.
- PostgreSQL модел и миграции за Wiki.
- Seed с няколко примерни статии.
- Базови unit/API тестове за Wiki (според Test Design).

### Sprint 2 – WS-CORE-2 (Auth + Wiki integration)

**Фокус:**

- Auth & Accounts skeleton и интеграция с Wiki потока.

**Основни цели:**

- FE екрани `/register`, `/login`, basic header state.
- BE: register/login endpoints, JWT, `GET /api/users/me`.
- Свързване на успешно логнат потребител към Wiki потока (redirect, видимо състояние "логнат").
- Unit/API тестове за основните Auth потоци.
- 1–2 E2E сценария (Guest→Register→Login→Wiki) според Test Design.

### Sprint 3 – WS-CORE-3 (Admin Dashboard) + подготовка за WS-CORE-4 (DX/CLI)

**Фокус:**

- Първи Admin vertical + подготовка за CLI tooling.

**Основни цели:**

- `/admin` Dashboard в FE с базови карти (брой потребители, статии).
- BE: `GET /api/admin/metrics/overview` + basic admin endpoints.
- Минимални роли и guard-ове (Admin vs User/Guest).
- Планиране на CLI структурата (`create-beelms-app`), евентуално първи прототип.

---

## 5. Връзка с Test Design и Delivery

- Всеки WS е съобразен с `docs/testing/beelms-core-test-design.md`:
  - Sprint 1 → фокус върху Wiki unit/API/E2E smoke сценарии.
  - Sprint 2 → Auth критични потоци (регистрация, login, профил).
  - Sprint 3 → Admin + Metrics smoke.
- Конкретните Test Plan и Release Plan документи ще бъдат развивани в Delivery фазата, но този
  документ дава основата за:
  - създаване на issues/борд в tracker-а;
  - подреждане на stories в backlog-а по спринтове.

---

## 6. Текущ статус на имплементацията (S1–S3, WS-CORE-1..4)

Източник на истина за статуса на спринтовете и walking skeleton-ите е
`docs/sprint-artifacts/beelms-core-sprint-status.yaml`. Кратко резюме към момента:

- **Sprint 1 – WS-CORE-1 (Core Wiki Vertical)** – **`done`**
  - Реализиран е Wiki vertical за Guest:
    - FE: `/wiki`, `/wiki/[slug]` (Next.js страници с филтри и детайл на статия).
    - API: `GET /api/wiki/articles`, `GET /api/wiki/articles/{slug}`.
    - BE: `WikiModule`, `WikiService`, `WikiController` + entity/model за статии и версии.
- **Sprint 2 – WS-CORE-2 (Auth + Wiki integration)** – **`done`**
  - Реализиран е Auth + Wiki vertical:
    - FE: `/auth/register`, `/auth/login`, header login state.
    - API: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/users/me`.
    - Поведение: след успешен login потребителят се пренасочва към `/wiki`.
- **Sprint 3 – WS-CORE-3 (Admin Dashboard) + WS-CORE-4 prep** – **`in_progress`**
  - **WS-CORE-3 – Admin Dashboard & Basic Settings** – **`done`**
    - FE: `/admin` dashboard с карти за общ брой потребители и статии, quick links към
      `/admin/wiki`, `/admin/users`, `/admin/metrics`, `/admin/activity`.
    - API: `GET /api/admin/metrics/overview`, `GET /api/admin/users/stats`, списъци за
      потребители и wiki статии.
  - **WS-CORE-4 – DX & CLI – `npx create-beelms-app`** – **`planned`**
    - Все още няма реална CLI имплементация; walking skeleton-ът е описан концептуално по-горе.

### Roadmap за довършване на S3 (WS-CORE-4 prep, без кодови детайли)

- **Уточняване на CLI целите**
  - Ясно дефиниране какво трябва да прави `npx create-beelms-app` за beelms core:
    - backend scaffold (NestJS core модули, готови за Docker Compose);
    - по избор frontend scaffold (Next.js) с готова връзка към API;
    - примерни `docker-compose` и `.env` файлове;
    - hook-ване към вече реализираните модули (Wiki, Auth, Admin).
- **Разбиване на WS-CORE-4 на stories/tasks**
  - Създаване на отделни stories за:
    - генериране на BE структура;
    - опционален FE scaffold;
    - инфраструктурни файлове (docker-compose, env templates, миграции/seed);
    - developer experience (npm/pnpm скриптове, README за новия проект).
- **Дефиниране на критерии за `Done` на S3**
  - Минимум: една CLI команда, която може да създаде нов beelms core проект, в който WS-CORE-1..3
    са лесни за активиране/конфигуриране (дори и не напълно автоматизирани в първата версия).
- **Планиране на следващ спринт (S4), ако е нужно**
  - Ако CLI обхватът излезе извън S3, остатъкът от WS-CORE-4 може да бъде изместен в Sprint 4,
    базиран на същия WS, но с по-дълбока автоматизация и DX подобрения.

---

## 7. Как да се използва този документ

- **PM / Tech Lead** – използват го, за да:
  - създадат EPIC-и/Stories/Tickets в избрания issue tracker;
  - дефинират цели на спринтове и критерии за "Done".
- **Разработчици** – виждат в кой vertical/спринт попада дадена задача и какво е минималното
  end-to-end поведение, което трябва да работи.
- **QA / DevOps** – използват го за планиране на тестове, smoke/regression suites и настройка на
  среди според walking skeleton-ите.

Документът е жив и може да бъде допълван със следващи спринтове (напр. Courses, Assessments,
Practical Lab, DX/CLI WS-CORE-4), когато екипът е готов да разшири обхвата отвъд първите три спринта.
