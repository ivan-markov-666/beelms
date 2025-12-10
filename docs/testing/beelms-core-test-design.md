# beelms core – Test Design / Strategy (MVP)

_Роля: QA / Tech Lead. Workflow: BMAD Solutioning / test-design._

## 1. Контекст и цел

Този документ описва **високониво тестов дизайн / стратегия** за рамката **beelms core** – не за
конкретна инстанция (QA4Free и др.), а за самия core продукт.

Входни документи:

- Product Brief – `docs/product/product-brief.md`
- PRD – `docs/product/prd.md`
- Brainstorm – `docs/backlog/brainstorm-beelms-core.md`
- Technical Research – `docs/analysis/research/technical-self-hosted-lms-architecture-research-2025-12-10.md`
- UX Design – `docs/ux-design-specification.md`
- System Architecture – `docs/architecture/beelms-core-architecture.md`
- EPIC & Story Map – `docs/backlog/beelms-core-epics-and-stories.md`
- Web automation scenarios (исторически) – `docs/testing/web-automation-scenarios.md`

**Цел:** Да опише _какво_ и _на кое ниво_ тестваме в beelms core (unit / API / E2E / non-functional),
как подреждаме приоритетите по EPIC-и и как това ще се използва по-късно в Test Plan и автоматизация.

---

## 2. Принципи

- **Quality built-in** – тестовете се проектират заедно с архитектурата и EPIC/STORY картата, не като
  „крайна проверка“.
- **Risk-based** – фокус върху критични потоци (Auth, GDPR, Security, Courses/Progress, Admin,
  Practical Lab, DX tooling).
- **Simple first** – за MVP избягваме прекалено сложни test frameworks; стъпваме на Jest + Playwright
  + Dockerized среди.
- **Traceability** – за всеки основен EPIC има ясно дефинирани тестови цели и нива на тестване.
- **Automation first for regression** – критичните happy-path и основни негативни сценарии да са
  автоматизирани възможно най-рано.

---

## 3. Обхват (In / Out of scope)

### 3.1. In scope (MVP хоризонт)

- Core модули (по архитектура и EPIC карта):
  - Auth & Accounts, Roles & RBAC
  - Wiki & Content
  - Courses & Learning Paths
  - Basic Assessments / Quizzes
  - Admin Portal & Settings
  - Practical Lab (UI demo + Training API, ако е активен)
  - DX / CLI & Instance tooling (create-beelms-app, миграции, seed)
  - Cross-cutting: I18N, GDPR/Legal, Metrics, Security
- Основни нефункционални проверки (на ниво MVP):
  - базови security проверки (OWASP Top 10 – smoke ниво);
  - базова performance/ресурсна здравина на Lean Tier 0 стек (няколко едновременни потребители);
  - стабилност на docker-compose деплой.

### 3.2. Out of scope (за отделни Test Plan-и по-късно)

- Advanced Exams & Case Studies (Post-MVP EPIC-CORE-ADV-EXAMS).
- Разширени reporting/analytics и dashboards.
- Истински shared multi-tenant модел.
- Пълни billing/monetization потоци.
- Advanced learning analytics и recommendation systems.
- Пълна performance/load тест стратегия за голям мащаб.

Тези теми ще бъдат покрити в бъдещи Test Plan-и, когато съответните EPIC-и влезнат в обхват.

---

## 4. Нива на тестване и инструменти

### 4.1. Unit tests

- **Обект:** NestJS services, guards, pipes, domain функции, helper-и.
- **Инструмент:** Jest.
- **Цели:**
  - покриване на бизнес логика (напр. изчисляване на прогрес, валидации, трансформации);
  - бърз feedback в CI;
  - минимална цел за критични модули: **~70%+** statement/branch coverage (Auth, Courses, Assessments).

### 4.2. API / Integration tests

- **Обект:** HTTP слоят и взаимодействие с база/infra (PostgreSQL, Redis по избор).
- **Инструмент:** Jest + Supertest (или еквивалент), отделна test база/миграции.
- **Цели:**
  - да валидират основни REST endpoints по FR от PRD (FR-AUTH, FR-WIKI, FR-ADMIN, FR-API-DEMO и др.);
  - да проверяват позитивни и негативни сценарии (HTTP кодове, error формати, валидации);
  - да осигурят стабилен базов regression suite без нужда от UI.

### 4.3. End-to-end (E2E) / UI tests

- **Обект:** основни UX потоци през референтния Next.js frontend.
- **Инструмент:** Playwright (както е описано в `web-automation-scenarios.md`).
- **Цели:**
  - да покриват ключови user journeys (Guest→Register→My Courses, Auth flows,
    Wiki browse, Admin basic);
  - да валидират интеграцията FE↔BE↔DB;
  - да служат като smoke suite за production/staging.

### 4.4. Non-functional tests (MVP ниво)

- **Security:**
  - basic проверки за auth/session поведение, rate limiting, XSS/CSRF/SQL injection защити;
  - статичен анализ и dependency vulnerability scan (напр. `npm audit`/Snyk – по-късно).
- **Performance / Stability:**
  - малък набор от сценарии (login, browse wiki, enroll course) с умерено паралелно натоварване;
  - цел: да няма фатални memory leaks/крашове при няколко едновременни потребители.

---

## 5. Критични потоци по EPIC-и (какво задължително тестваме)

Тук описваме _какви_ потоци са критични по EPIC и _какви нива_ на тестване са задължителни.

### 5.1. EPIC-CORE-AUTH-ACCOUNTS – Auth & Accounts

Основни потоци:

- Регистрация и login (happy path и основни грешки).
- Forgotten/Reset password flow с валиден/невалиден токен.
- Профилен екран и обновяване на базови данни.
- GDPR delete/export потоци (право да бъдеш забравен, преносимост).
- Basic защита – rate limiting и anti-bot.

Нива на тестване:

- Unit: бизнес логика за валидации, токени, password hashing, rate-limit вътрешна логика.
- API/Integration: всички основни REST endpoints (PRD §4.2, FR-AUTH-1..8).
- E2E: основни user journeys (register + login + profile + delete/export), както и негативни
  сценарии (invalid creds, expired token). Част от това вече е скицирано в
  `web-automation-scenarios.md`.

### 5.2. EPIC-CORE-WIKI-CONTENT – Wiki & Content

Основни потоци:

- Публичен списък със статии (търсене, филтри по език, статус Active).
- Преглед на статия и превключване на език.
- Admin/Author създаване/редакция на статии, статут Draft/Active/Inactive.

Нива на тестване:

- Unit: content services (избор на статии по статус, език, категории).
- API/Integration: `GET /api/wiki/articles`, `GET /api/wiki/articles/{slug}`, admin endpoints.
- E2E: browse wiki, search/filter, отваряне на статия (WA-WIKI-* сценарии + Admin сценарии по-късно).

### 5.3. EPIC-CORE-COURSES-PROGRESS – Courses & Learning Paths

Основни потоци:

- Създаване/редакция на курс (teacher/admin) и връзка с wiki съдържание.
- Enrollment в курс и проследяване на прогрес (completed/in progress).
- Показване на Course Catalog и Course Detail.

Нива на тестване:

- Unit: логика за прогрес, изчисления за завършеност.
- API/Integration: endpoints за курсове, enrollment, прогрес.
- E2E: My Courses, Course Detail, basic progress flow.

### 5.4. EPIC-CORE-ASSESSMENTS – Basic Assessments & Quizzes

Основни потоци:

- Дефиниране на прост quiz (MCQ/single choice) за урок.
- Delivery и попълване на quiz.
- Оценяване (pass/fail, score) и запис на резултати.

Нива на тестване:

- Unit: scoring логика и валидации.
- API/Integration: endpoints за quiz-ове (load, submit).
- E2E: решаване на quiz от крайния потребител като част от курс.

### 5.5. EPIC-CORE-ADMIN-PORTAL – Admin Portal & Settings

Основни потоци:

- Admin Dashboard с базови метрики.
- Управление на wiki статии и статуси.
- Управление на потребители (активиране/деактивиране, роли).
- Настройки за feature toggles и интеграции.

Нива на тестване:

- Unit: permissions и настройки.
- API/Integration: admin endpoints; защита на достъпа (Admin-only).
- E2E: основни admin екрани (Dashboard, Users, Wiki Management).

### 5.6. EPIC-CORE-PRACTICAL-LAB – Practical Lab (UI + API demo)

Основни потоци:

- UI demo страница с богати HTML елементи и Reset.
- Training API (ping/echo) + Swagger UI.

Нива на тестване:

- Unit / Integration: basic проверка на API endpoints.
- E2E: навигация до Practical Lab, основни UI взаимодействия, проверка на Reset.

### 5.7. EPIC-CORE-DX-CLI-INFRA – DX, CLI & Instance Tooling

Основни потоци:

- `npx create-beelms-app` scaffold (backend + по избор frontend + docker-compose).
- Стартиране на docker-compose стек в dev/test режим.
- Миграции и seed за примерни данни.
- Създаване на нова инстанция чрез tooling.

Нива на тестване:

- Script-level tests / smoke scripts (shell, Node scripts).
- Интеграционни сценарии: „scaffold → docker-compose up → basic health/smoke tests“.

### 5.8. EPIC-CORE-CROSS-I18N – Internationalization (I18N)

- Unit: utilities за локализация/езици.
- API/Integration: коректно съхранение/четене на езикови варианти.
- E2E: езиков switcher, визуализация на преводи.

### 5.9. EPIC-CORE-CROSS-GDPR-LEGAL – GDPR & Legal Pages

- API/Integration: GDPR endpoints (access/delete/export) със силни негативни сценарии.
- E2E: достъп до Privacy/GDPR и Terms страници, интеграция с регистрацията.

### 5.10. EPIC-CORE-CROSS-METRICS – Core Metrics & Monitoring

- Integration: API за метрики, коректно броене на регистрирани потребители.
- Smoke: наличност на basic metrics endpoint-и след деплой.

### 5.11. EPIC-CORE-CROSS-SECURITY – Security & Protection

- Unit: части от security логика (напр. password policy, токен валидация).
- API/Integration: защита срещу типични злоупотреби (brute force login, твърде много reset-и и др.).
- E2E: проверка на поведение при блокирани акаунти, изтекли сесии и др.

---

## 6. Тестови среди и данни

- **Dev среда:** docker-compose стек за локална разработка.
- **Test/Staging среда:** подобен стек, но с отделна база и конфигурации.
- **Test data:**
  - seed-нати base данни (админ потребител, примерни статии и курсове);
  - фиксирани акаунти за различни роли (Admin, Teacher, Content Author, Monitoring);
  - данни за негативни сценарии (погрешни креденшъли, деактивирани акаунти, изтекли токени).
- **Reset стратегия:**
  - миграции + seed преди suite;
  - при нужда – специални test-only endpoints или скриптове за cleanup.

---

## 7. Автоматизация и CI

- **Unit + API tests:**
  - стартират се при всеки push/PR към backend кода;
  - бърз feedback; fail блокира merge.
- **E2E / UI tests:**
  - изпълняват се поне в nightly build или при release candidate;
  - smoke subset може да се пуска и на всеки PR (ограничен брой сценарии).
- **Reporting:**
  - базови текстови отчети в CI logs;
  - по-късно – интеграция с отчетни dashboards.

---

## 8. Smoke vs Regression suites

- **Smoke suite (deployment validation):**
  - минимални сценарии по основните EPIC-и (Auth happy path, Wiki list/article,
    My Courses, 1 quiz flow, Admin Dashboard, Practical Lab ping, metrics endpoint);
  - цел: бърза проверка, че инстанцията е здравa след деплой.

- **Regression suite:**
  - по-пълен набор от API + E2E тестове, обхващащи позитивни и негативни сценарии;
  - изпълнява се преди release и периодично (напр. nightly).

---

## 9. Връзка към други BMAD артефакти и бъдещи документи

- Този Test Design стъпва директно върху:
  - PRD функционалните области (FR-WIKI, FR-AUTH, FR-UI-DEMO, FR-API-DEMO, FR-TASKS, FR-ADMIN, FR-CROSS);
  - архитектурните модули в `beelms-core-architecture.md`;
  - EPIC/STORY картата в `beelms-core-epics-and-stories.md`.
- Той служи като **вход** за:
  - бъдещ Delivery **Test Plan** – `docs/delivery/test-plan.md`, който ще описва конкретни цикли,
    критерии за приемане и release gates;
  - имплементацията на автоматизирани тестове (unit/API/E2E), включително сценарии
    от `docs/testing/web-automation-scenarios.md`.

Този документ е жив – очаква се да бъде актуализиран, когато EPIC обхватът се разширява или когато се
взимат нови решения за tooling, среди и нива на автоматизация.
