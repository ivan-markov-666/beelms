# QA4Free – Walking Skeletons (MVP)

_Роля: Tech Lead / Architect / Delivery. Фаза: BMAD Delivery – Walking Skeletons. Този документ описва първите вертикални slice-ове, които ще имплементираме във Фаза 3._

## 1. Цел и обхват

- Да определи **walking skeleton-и** за MVP – тънки, но реални end-to-end потоци през **Frontend + API + DB**.
- Да осигури **ясен старт на Фаза 3**, преди пълната имплементация на всички модули.
- Да свърже **PRD / MVP feature list / UX / OpenAPI / DB модел** с конкретен план за първите вертикали.

В този документ първо се дефинира **WS-1 (Wiki)**. Бъдещи walking skeleton-и (Auth, Sandbox UI, Admin) могат да бъдат добавени в следващи секции.

---

## 2. WS-1 – Guest → Wiki List → Wiki Article

### 2.1. Кратко описание

**Сценарий:**

1. Гост потребител отваря `/wiki`.
2. Вижда списък със Wiki статии (заглавие, език, кратка информация).
3. Кликва върху статия → зарежда се `/wiki/[slug]` с пълното съдържание.

**Технически:**

- Next.js frontend рендерира `/wiki` и `/wiki/[slug]`.
- Frontend вика NestJS API ендпойнти:
  - `GET /api/wiki/articles`
  - `GET /api/wiki/articles/{slug}`
- API използва реална PostgreSQL база и моделите `WikiArticle` и `WikiArticleVersion`.

### 2.2. Свързани артефакти и изисквания

WS-1 стъпва върху съществуващите BMAD артефакти:

- **Product Brief** – `docs/product/product-brief.md`
  - Wiki като централно хранилище на знания (лекционен материал).
- **PRD** – `docs/product/prd.md`
  - Секция **4.1. Публична Wiki (FR-WIKI)** – FR-WIKI-1 … FR-WIKI-5.
- **MVP feature list** – `docs/architecture/mvp-feature-list.md`
  - §1 „Публична Wiki (без акаунт)“ – екрани SCR-WIKI-LST и SCR-WIKI-ART.
- **System Architecture** – `docs/architecture/system-architecture.md`
  - Компоненти за Wiki услугата и публичните роли (Guest/User/Admin).
- **OpenAPI спецификация** – `docs/architecture/openapi.yaml`
  - `GET /api/wiki/articles`
  - `GET /api/wiki/articles/{slug}`
- **DB модел** – `docs/architecture/db-model.md`
  - Ентитети `WikiArticle` и `WikiArticleVersion`.
- **UX Design** – `docs/ux/qa4free-ux-design.md`
  - Екрани SCR-WIKI-LST и SCR-WIKI-ART, глобален layout и навигация.
- **User Flows** – `docs/ux/flows/qa4free-user-flows.md`
  - FLOW-WIKI-BROWSE, FLOW-WIKI-NOT-FOUND.
 - **WS-1 Demo & Test Checklist** – `docs/sprint-artifacts/WS1-wiki-demo-checklist.md`

### 2.3. Обхват по слоеве

#### 2.3.1. Frontend (Next.js)

- Initial routing и страници:
  - `/wiki` → списък със статии (минимални полета: заглавие, език, последна редакция).
  - `/wiki/[slug]` → съдържание на статия.
- Използване на общия layout shell (header + footer) от UX документа, реализиран като споделен layout компонент (един централен компонент, който се преизползва от всички основни екрани).
- Минимална логика за:
  - състояния „зареждане“, „празен списък“, „грешка“;
  - 404 състояние при невалиден slug (FLOW-WIKI-NOT-FOUND).
- Езикът може да е фиксиран (напр. BG) в първата версия; пълното поведение на language switcher-а може да дойде по-късно.

- UI елементите на тези страници (бутони, линкове, текстови полета, съобщения за грешки/успех) използват базови преизползваеми UI компоненти, съобразени с правилата от `docs/ux/design-system.md` (обща компонентна библиотека за MVP нивото).

#### 2.3.2. Backend (NestJS API)

- Създаване на `WikiModule` с минимум:
  - `WikiController` с actions за `GET /api/wiki/articles` и `GET /api/wiki/articles/{slug}`;
  - `WikiService` за работа с репозиторита/ORM моделите.
- Първа стъпка (по избор):
  - in-memory имплементация с фиксиран масив от статии за бърз FE/BE loop.
- Втора стъпка:
  - свързване към реалната база данни и TypeORM моделите за Wiki;
  - филтриране по `status = active` за публичните екрани.

#### 2.3.3. База данни (PostgreSQL)

- Прилага модела от `db-model.md` за:
  - `WIKI_ARTICLE` (id, slug, status, timestamps);
  - `WIKI_ARTICLE_VERSION` (id, article_id, language, title, content, version_number, created_at).
- Минимални миграции:
  - създаване на двете таблици + базови индекси (по slug, статус, език);
  - seed с 2–3 примерни статии (поне една с BG, по възможност и EN версия).

### 2.4. Необхват за WS-1

Следните теми са **извън** обхвата на WS-1 и се покриват от други verticals/фази:

- Администраторски екрани за създаване/редакция на статии (Admin Wiki).
- Версиониране и diff UI за статиите.
- Качване на изображения (Wiki media storage).
- Пълна мултиезичност в UI (освен минимална поддръжка, ако е необходима за демо).
- Auth, профил и GDPR потоци.
- Практическа среда (Sandbox UI, Training API).

WS-1 е фокусиран върху **публичното четене на Wiki съдържание от гост потребител**, за да валидираме край-до-край:

- dev средата (Docker / локален run);
- базова архитектура (Next.js + NestJS + Postgres);
- свързаност FE ↔ API ↔ DB за реален domain обект.

---

## 3. WS-3 – Practical Environment (Training API + UI Demo)

### 3.1. Кратко описание

**Сценарий:**

1. Гост потребител отваря `/practice/ui-demo` от глобалната навигация "Практика".
2. На екрана вижда:
   - кратко обяснение за Practical Environment;
   - sandbox UI с бутони, текстови полета, dropdown, чекбоксове/радио бутони и малка таблица;
   - секция „Примерни задачи“, която описва как да използва тези елементи за manual и UI automation упражнения.
3. По избор потребителят може да отвори `/practice/api-demo`, за да види Training API intro и линк към Swagger UI на Training API.

**Технически:**

- Next.js frontend:
  - страници `/practice/ui-demo` и `/practice/api-demo`;
  - глобална навигация "Практика" → `/practice/ui-demo`;
  - в WS-3 UI Demo екранът е изцяло FE-only (без директни BE заявки).
- Training API backend:
  - самостоятелен NestJS service `training-api` с глобален prefix `/api/training`;
  - ендпойнти:
    - `GET /api/training/ping`;
    - `POST /api/training/echo`;
  - Swagger UI на `/api/training/docs`.

### 3.2. Свързани артефакти и изисквания

WS-3 Practical Env стъпва върху следните BMAD артефакти:

- **PRD** – `docs/product/prd.md` §4.3 (FR-UI-DEMO-1..3 и FR-TRAINING-API-1..2).
- **MVP feature list** – `docs/architecture/mvp-feature-list.md` §3.1 (Practical UI Demo + Training API).
- **System Architecture** – `docs/architecture/system-architecture.md` (компоненти за Practical Environment).
- **OpenAPI спецификация** – `docs/architecture/openapi.yaml`:
  - `GET /api/training/ping`;
  - `POST /api/training/echo`.
- **EPIC-и**:
  - `docs/backlog/ws-3/epics/EPIC-WS3-PRACTICAL-API-DEMO.md`;
  - `docs/backlog/ws-3/epics/EPIC-WS3-PRACTICAL-UI-DEMO.md`.
- **Stories (WS-3 Practical Env)** – в `docs/backlog/ws-3/stories/`:
  - BE Training API minimal + Swagger stories;
  - `STORY-WS3-FE-TRAINING-API-INTRO` (страница `/practice/api-demo`);
  - `STORY-WS3-FE-UI-DEMO-TASKS` (текстови примерни задачи);
  - `STORY-WS3-FE-UI-DEMO-PAGE` (UI елементи + Reset логика и навигация).

### 3.3. Обхват по слоеве

#### Frontend (Next.js)

- `/practice/ui-demo`:
  - използва глобалния layout (header + footer) и i18n навигация;
  - показва header с обяснение за Practical Env;
  - съдържа sandbox секция с:
    - поне 3 различни бутона (primary/secondary/disabled) и бутон Reset;
    - текстови полета с валидация и съобщения за грешка;
    - dropdown "Ниво на трудност" с няколко опции;
    - група чекбоксове + радио бутони с текстово обобщение на избора;
    - малка таблица/списък с "демо задачи" и филтър по трудност.
  - съдържа секция „Примерни задачи“, която описва примерни QA упражнения върху тези елементи.
- `/practice/api-demo`:
  - представя Training API и сочи към Swagger UI на Training API;
  - описва примерни сценарии за тестване на `GET /api/training/ping` и `POST /api/training/echo`.
- Глобален header nav:
  - елементът "Практика" / "Practice" води към `/practice/ui-demo`.

#### Backend (Training API service)

- Самостоятелно NestJS приложение `training-api`:
  - модул и контролер за ping/echo eндпойнтите;
  - базова валидация на входните данни за echo;
  - интегриран Swagger UI за dev/demo.

#### База данни

- WS-3 Practical Env skeleton **не изисква** отделен DB модел – Training API е stateless (echo/ping), а UI Demo е изцяло frontend-only.

### 3.4. Необхват за WS-3

- Няма реални training сесии, прогрес или запазване на данни в база.
- Няма auth/permissions за Practical Env (екраните са публични).
- Няма сложни backend сценарии извън ping/echo.
- Няма пълни end-to-end сценарии между Wiki/Auth/Practical Env – WS-3 се фокусира върху самостоятелен Practical Env vertical.

---

## 4. Бъдещи walking skeleton-и (примерна рамка)

Тази секция очертава потенциални следващи verticals, които могат да бъдат описани в отделни под-секции (WS-2, WS-4 и т.н.):

- **WS-2 – Auth & Account skeleton**
  - Guest → Login → Account → Logout (минимален flow за FR-AUTH).
  - Demo & Test Checklist – `docs/sprint-artifacts/WS2-auth-demo-checklist.md`.
- **WS-4 – Admin skeleton**
  - Admin login → Admin Dashboard → Admin Wiki List (read-only първоначално).

Конкретните дефиниции за WS-4+ могат да се добавят, когато екипът реши приоритетния ред на verticals. Във всички случаи **WS-1 остава първия skeleton**, който отключва реалната разработка на MVP.
