# beelms – Walking Skeletons (MVP)

_Роля: Tech Lead / Architect / Delivery. Фаза: BMAD Delivery – Walking Skeletons. Този документ описва първите вертикални slice-ове, които ще имплементираме във Фаза 3._

## 1. Цел и обхват
 
 - Да определи **walking skeleton-и** за MVP – тънки, но реални end-to-end потоци през **Frontend + API + DB**.
 - Да осигури **ясен старт на Фаза 3**, преди пълната имплементация на всички модули.
 - Да свърже **PRD / MVP feature list / UX / OpenAPI / DB модел** с конкретен план за първите вертикали.
 
 Правило: Номерацията (WS-1..WS-n) е идентификатор за vertical slice-ове и не е задължително да съвпада с реда на имплементация. Реалният ред на изпълнение се определя от delivery приоритетите.

 В този документ първо се дефинира **WS-1 (Wiki)**. Следва **WS-3 (Courses & Assessments)**. Останалите walking skeleton-и (Auth, Admin) могат да бъдат добавени в следващи секции.
 
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
- **System Architecture** – `docs/architecture/beelms-core-architecture.md`
  - Компоненти за Wiki услугата и публичните роли (Guest/User/Admin).
- **OpenAPI спецификация** – `docs/architecture/openapi.yaml`
  - `GET /api/wiki/articles`
  - `GET /api/wiki/articles/{slug}`
- **DB модел** – `docs/architecture/db-model.md`
  - Ентитети `WikiArticle` и `WikiArticleVersion`.
 
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

- Прилага модела от `docs/architecture/db-model.md` за:
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

WS-1 е фокусиран върху **публичното четене на Wiki съдържание от гост потребител**, за да валидираме край-до-край:

- dev средата (Docker / локален run);
- базова архитектура (Next.js + NestJS + Postgres);
- свързаност FE ↔ API ↔ DB за реален domain обект.

---

## 3. WS-3 – User → My Courses → Course Detail → Task + Quiz

### 3.1. Кратко описание

**Сценарий:**

1. Регистриран потребител (логнат) отваря `/courses`.
2. Вижда Course Catalog и отваря детайл на курс → `/courses/[courseId]`.
3. Записва се (enroll) в курса.
4. Отваря `/my-courses` и вижда записания курс + базов прогрес.
5. В Course Detail вижда задача и quiz.
6. Маркира задачата като изпълнена и решава quiz → получава резултат и прогресът се обновява.

**Технически:**

- Next.js frontend рендерира `/courses`, `/courses/[courseId]` и `/my-courses`.
- Frontend вика NestJS API ендпойнти (планирани):
  - `GET /api/courses`
  - `GET /api/courses/{courseId}`
  - `POST /api/courses/{courseId}/enroll`
  - `GET /api/users/me/courses`
  - `POST /api/courses/{courseId}/tasks/{taskId}/complete`
  - `GET /api/courses/{courseId}/quizzes/{quizId}`
  - `POST /api/courses/{courseId}/quizzes/{quizId}/submit`
- API използва реална PostgreSQL база и минимален модел за курсове, enrollment, task completions и quiz attempts.

### 3.2. Свързани артефакти и изисквания

- **Product Brief** – `docs/product/product-brief.md`
  - Courses, Tasks/Quizzes.
- **PRD** – `docs/product/prd.md`
  - FR-COURSES, FR-TASKS, FR-ASSESSMENTS.
- **MVP feature list** – `docs/architecture/mvp-feature-list.md`
  - §6 „Курсове“, §7 „Практически задачи и quizzes“.
- **OpenAPI спецификация** – `docs/architecture/openapi.yaml`
  - ендпойнти за Courses/Tasks/Quizzes (планирани за MVP).
- **DB модел** – `docs/architecture/db-model.md`
  - ентитети за Courses/Enrollments/Tasks/Quizzes (планирани за MVP).

  - **WS-3 Demo & Test Checklist** – `docs/sprint-artifacts/WS3-courses-assessments-demo-checklist.md`

### 3.3. Обхват по слоеве

#### 3.3.1. Frontend (Next.js)

- Initial routing и страници:
  - `/courses` → Course Catalog.
  - `/courses/[courseId]` → Course Detail (curriculum: урок/статия, задача, quiz).
  - `/my-courses` → записани курсове + базов прогрес.
- Минимална логика за „зареждане“, „празен списък“, „грешка“.

#### 3.3.2. Backend (NestJS API)

- Нови модули/контролери за Courses и Assessments (quizzes).
- JWT защита за enrollment, my-courses, complete task и quiz submit.

#### 3.3.3. База данни (PostgreSQL)

- Таблици за курсове, enrollment, tasks, task completions, quizzes и quiz attempts.

### 3.4. Необхват за WS-3

- Full authoring UX (teacher/content author) за редакция на курсове и quizzes.
- Разширени learning analytics и метрики за индивидуален напредък (exams модул).
- Advanced question types (multi-select, open answers).

---

## 4. Бъдещи walking skeleton-и (примерна рамка)

Тази секция очертава потенциални следващи verticals, които могат да бъдат описани в отделни под-секции (WS-2, WS-4 и т.н.):

- **WS-2 – Auth & Account skeleton**
  - Guest → Login → Account → Logout (минимален flow за FR-AUTH).
  - Demo & Test Checklist – `docs/sprint-artifacts/WS2-auth-demo-checklist.md`.
- **WS-4 – Admin skeleton**
  - Admin login → Admin Dashboard → Admin Wiki List (read-only първоначално).

Конкретните дефиниции за WS-4+ могат да се добавят, когато екипът реши приоритетния ред на verticals. Във всички случаи **WS-1 остава първия skeleton**, който отключва реалната разработка на MVP.
