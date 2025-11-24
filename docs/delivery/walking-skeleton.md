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

## 3. Бъдещи walking skeleton-и (примерна рамка)

Тази секция очертава потенциални следващи verticals, които могат да бъдат описани в отделни под-секции (WS-2, WS-3 и т.н.):

- **WS-2 – Auth & Account skeleton**
  - Guest → Login → Account → Logout (минимален flow за FR-AUTH).
  - Demo & Test Checklist – `docs/sprint-artifacts/WS2-auth-demo-checklist.md`.
- **WS-3 – Sandbox UI skeleton**
  - Guest → Practical UI → Text Box / Complex Form страници (основна навигация и един-два ключови екрана).
- **WS-4 – Admin skeleton**
  - Admin login → Admin Dashboard → Admin Wiki List (read-only първоначално).

Конкретните дефиниции за WS-2+ могат да се добавят, когато екипът реши приоритетния ред на verticals. Във всички случаи **WS-1 остава първия skeleton**, който отключва реалната разработка на MVP.
