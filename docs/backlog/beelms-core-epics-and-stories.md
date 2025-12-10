# beelms core – EPIC & Story Map

_Роля: PM / Architect. Workflow: BMAD Solutioning / create-epics-and-stories._

## 1. Контекст

Този документ описва **EPIC-и и основни stories** за рамката **beelms core**.
Фокусът е върху:

- извеждане на ядрени епик-и за първия **MVP** на рамката;
- маркиране на **post-MVP** и "later" възможности в хоризонт **6–12 месеца**;
- осигуряване на връзка между **Product Brief**, **PRD**, **Brainstorm**, **Technical Research**,
  **UX Design Specification** и **System Architecture**.

Документът е на ниво **core рамка**, а не конкретна инстанция (QA4Free и др.). Конкретни продукти върху
beelms трябва да имат собствени EPIC/STORY документи, които стъпват върху настоящата карта.

---

## 2. MVP EPIC-и (beelms core)

| EPIC ID | Име | Област | MVP? | Източници (основни) | Бележки |
| --- | --- | --- | --- | --- | --- |
| **EPIC-CORE-AUTH-ACCOUNTS** | Auth & Accounts Core Module | Auth / Users | **Да (MVP)** | PRD §4.2, Brief §4–5, Arch §3.1 (AuthModule, UsersModule) | Регистрация, login, профил, GDPR delete/export, базова сигурност. |
| **EPIC-CORE-WIKI-CONTENT** | Wiki & Content Core Module | Wiki / Content | **Да (MVP)** | PRD §4.1, Brief §4, UX §3–5, Arch §3.1 (WikiModule) | Публична wiki, статии, категории, basic search, multi-language. |
| **EPIC-CORE-COURSES-PROGRESS** | Courses & Learning Paths | Learning / Courses | **Да (MVP – базов)** | Brief §1–4, Brainstorm §5–6, Arch §3.1 (CoursesModule) | Дефиниране на курсове, enrollment, базов прогрес (completed/in progress). |
| **EPIC-CORE-ASSESSMENTS** | Basic Assessments & Quizzes | Learning / Assessment | **Да (MVP – минимален)** | Brief §4, PRD §4.5 (частично), Brainstorm §5–6, Arch §3.1 (AssessmentsModule) | Прости quiz-и (MCQ/single choice) за уроци, без сложен exam engine. |
| **EPIC-CORE-ADMIN-PORTAL** | Admin Portal & Settings | Admin | **Да (MVP)** | PRD §4.6, UX §3.2, §5.9, Arch §2.1 (Admin & Settings) | Управление на съдържание, потребители, базови настройки и метрики. |
| **EPIC-CORE-PRACTICAL-LAB** | Practical Lab (UI + API demo) | Practical Env | **Да (MVP – опционален модул)** | PRD §4.3–4.4, UX §3.1, §5.6–5.7, Arch §2.1 (Training API) | Референтни модули за QA/technical training (UI demo + Training API), включваеми през конфигурация. |
| **EPIC-CORE-DX-CLI-INFRA** | DX, CLI & Instance Tooling | DevEx / Infra | **Да (MVP)** | Brief §6, Research §4.3, Arch §2.1 (CLI), §5, Brainstorm §5.6–5.7 | `npx create-beelms-app`, docker-compose стек, миграции, seed, tooling за нова инстанция. |
| **EPIC-CORE-CROSS-I18N** | Internationalization (I18N) | Cross-cutting | **Да (MVP)** | PRD §4.7 FR-CROSS-1, UX §2–3, MCP EPIC map (I18N) | Поддръжка на поне BG/EN за UI и съдържание. |
| **EPIC-CORE-CROSS-GDPR-LEGAL** | GDPR & Legal Pages | Cross-cutting | **Да (MVP)** | PRD §4.7 FR-CROSS-2, FR-LEGAL-1, PRD §5.2, Arch §7, Research §2 | GDPR потоци (access/delete/export), Privacy/GDPR, Terms of Use. |
| **EPIC-CORE-CROSS-METRICS** | Core Metrics & Monitoring | Cross-cutting | **Да (MVP – минимално)** | PRD §4.7 FR-CROSS-3, PRD §4.6 FR-ADMIN-4, Arch §2.1 (Metrics & Monitoring API), §7 | Агрегирани метрики (брой регистрирани потребители, активни курсове). |
| **EPIC-CORE-CROSS-SECURITY** | Security & Protection | Cross-cutting | **Да (MVP)** | PRD §4.2 FR-AUTH-7..8, §4.7 FR-CROSS-4, PRD §5.2, Arch §7 | Rate limiting, защити срещу CSRF/XSS/SQL injection, basic anti-bot механизми. |

---

## 3. Post-MVP EPIC-и (beelms core)

| EPIC ID | Име | Област | MVP? | Източници | Бележки |
| --- | --- | --- | --- | --- | --- |
| **EPIC-CORE-ADV-EXAMS** | Advanced Exams & Case Studies | Learning / Assessment | **Не (Post-MVP)** | Brief §5.1 (2.7), PRD §4.5, Brainstorm §6.2 | По-богат модел за изпити, банки с въпроси, теглене на варианти. |
| **EPIC-CORE-ADV-REPORTING** | Advanced Reporting & Dashboards | Analytics | **Не (Post-MVP)** | Brainstorm §6.2, Arch §7, Research §4.4 | Разширени dashboards и отчети за преподаватели/администратори. |
| **EPIC-CORE-MULTI-TENANT** | Shared Multi-tenant Mode | Tenancy | **Не (Later)** | Brainstorm §4.1, §6.3, Research §2 | Истински shared multi-tenant (OrgID навсякъде, много организации в една инстанция). |
| **EPIC-CORE-BILLING-MONETIZATION** | Billing & Monetization | Monetization | **Не (Post-MVP)** | Brief §5.1 (2.10), Brainstorm §6.2 | Интеграции с платежни системи, платени курсове и продукти. |
| **EPIC-CORE-ADV-ANALYTICS-RECS** | Learning Analytics & Recommendations | Analytics | **Не (Later)** | Brainstorm §6.3, Arch §7.3 | Разширени learning analytics, препоръчващи системи, сегментиране по поведение. |
| **EPIC-CORE-ADV-PRACTICE-ENV** | Advanced Practical Environment | Practical Env | **Не (Post-MVP)** | Brainstorm §5.5, §6.2, UX §5.6–5.7 | Повече типове упражнения, по-богат Training API, интеграции с sandbox изпълнения. |

Тези EPIC-и описват по-широката визия за beelms core и могат да бъдат активирани, когато има ресурс
и нужда над първия MVP.

---

## 4. Story breakdown за MVP EPIC-ите

### 4.1. EPIC-CORE-AUTH-ACCOUNTS – Auth & Accounts Core Module

- **STORY-CORE-AUTH-REGISTER-LOGIN** – Регистрация и login с email и парола според PRD §4.2.
- **STORY-CORE-AUTH-FORGOT-RESET** – Флоу за забравена парола с токен, валиден 24 часа.
- **STORY-CORE-AUTH-PROFILE-EDIT** – Екран и API за редакция на базов профил (име, език, предпочитания).
- **STORY-CORE-AUTH-GDPR-DELETE-EXPORT** – Поток за изтриване и експорт на акаунт (right to be forgotten, data export).
- **STORY-CORE-AUTH-ROLES-RBAC** – RBAC с роли Admin, User, Guest, Teacher, Content Author, Monitoring.

### 4.2. EPIC-CORE-WIKI-CONTENT – Wiki & Content Core Module

- **STORY-CORE-WIKI-PUBLIC-LIST** – Публичен списък със статии с филтри по език и търсене (FR-WIKI-1,2).
- **STORY-CORE-WIKI-ARTICLE-VIEW** – Екран и API за статия (FR-WIKI-3,4,5), превключване на език.
- **STORY-CORE-WIKI-EDITOR** – Admin/Author UI за създаване и редакция на wiki статии (multi-language).
- **STORY-CORE-WIKI-CATEGORIES-TAGS** – Категории/тагване за по-добра навигация и филтри.

### 4.3. EPIC-CORE-COURSES-PROGRESS – Courses & Learning Paths

- **STORY-CORE-COURSES-MODEL** – Домейн модел за Course, Module, Lesson, връзка към статии и quizzes.
- **STORY-CORE-COURSES-ENROLLMENT** – Enrollment флоу (записване/отписване) за регистрирани потребители.
- **STORY-CORE-COURSES-PROGRESS-TRACKING** – Базов прогрес (completed/in progress) на ниво урок/курс.
- **STORY-CORE-COURSES-CATALOG-UI** – Course Catalog и Course Detail екрани (UX §5.4–5.5).

### 4.4. EPIC-CORE-ASSESSMENTS – Basic Assessments & Quizzes

- **STORY-CORE-ASSESSMENTS-MODEL** – Модел за quiz, въпроси и отговори (MCQ/single choice).
- **STORY-CORE-ASSESSMENTS-DELIVERY** – UI + API за решаване на quiz към урок.
- **STORY-CORE-ASSESSMENTS-SCORING** – Оценяване и запис на резултати (pass/fail, score).

### 4.5. EPIC-CORE-ADMIN-PORTAL – Admin Portal & Settings

- **STORY-CORE-ADMIN-DASHBOARD** – Admin Dashboard с базови карти/метрики (брой потребители, активни курсове).
- **STORY-CORE-ADMIN-USERS-MANAGEMENT** – Управление на потребители (роля, статус, блокиране).
- **STORY-CORE-ADMIN-WIKI-MANAGEMENT** – Управление на wiki статии и статуса им (Active/Draft/Inactive).
- **STORY-CORE-ADMIN-SETTINGS-FEATURE-TOGGLES** – Настройки за активиране/деактивиране на модули.
- **STORY-CORE-ADMIN-LEGAL-PAGES** – Управление на статични страници Terms of Use, Privacy/GDPR.

### 4.6. EPIC-CORE-PRACTICAL-LAB – Practical Lab (UI + API demo)

- **STORY-CORE-PRACTICE-UI-DEMO-PAGE** – UI Demo страница с групирани HTML компоненти и „Reset" (UX §5.6).
- **STORY-CORE-PRACTICE-API-DEMO-ENDPOINTS** – Минимален Training API (ping/echo) + Swagger UI (PRD §4.4).
- **STORY-CORE-PRACTICE-INTEGRATION-NAV** – Връзка към Practical Lab от основната навигация (UX §3.1).

### 4.7. EPIC-CORE-DX-CLI-INFRA – DX, CLI & Instance Tooling

- **STORY-CORE-CLI-SCAFFOLD** – `npx create-beelms-app` scaffold (backend + опционален frontend, .env шаблони).
- **STORY-CORE-DOCKER-COMPOSE-STACK** – Docker Compose стек за Lean Tier 0 (backend, frontend, postgres, redis по избор).
- **STORY-CORE-MIGRATIONS-SEED** – Стандартизиран процес за миграции и seed (incl. примерни данни).
- **STORY-CORE-MULTI-INSTANCE-TOOLING** – Скриптове/tooling за създаване на нова инстанция (нова база, конфигурация).

### 4.8. EPIC-CORE-CROSS-I18N – Internationalization (I18N)

- **STORY-CORE-I18N-FRONTEND** – I18N поддръжка във frontend (BG/EN, language switcher, локализирани текстове).
- **STORY-CORE-I18N-CONTENT** – Поддръжка на множество езикови версии на статии и курсове.

### 4.9. EPIC-CORE-CROSS-GDPR-LEGAL – GDPR & Legal Pages

- **STORY-CORE-GDPR-USER-FLOWS** – API/UX за достъп, изтриване, преносимост на лични данни.
- **STORY-CORE-GDPR-PRIVACY-PAGE** – Публична страница Privacy/GDPR.
- **STORY-CORE-LEGAL-TERMS-PAGE** – Публична страница Terms of Use и интеграция с регистрационния флоу.

### 4.10. EPIC-CORE-CROSS-METRICS – Core Metrics & Monitoring

- **STORY-CORE-METRICS-AGG-USERS** – Агрегирана метрика "брой регистрирани потребители" в Admin Dashboard.
- **STORY-CORE-METRICS-TECH-MONITORING** – Базови технични метрики (health endpoints, request latency/Логове).

### 4.11. EPIC-CORE-CROSS-SECURITY – Security & Protection

- **STORY-CORE-SECURITY-RATE-LIMITING** – Rate limiting за чувствителни операции (login, forgot/reset, export).
- **STORY-CORE-SECURITY-OWASP-BASICS** – CSRF/XSS/SQL injection защити според NestJS/ORM best practices.
- **STORY-CORE-SECURITY-ACCOUNT-PROTECTION** – Basic anti-bot/anti-bruteforce механизми.

---

## 5. Връзка към BMAD workflows и следващи стъпки

- Този документ е основен вход за:
  - **test-design** – дефиниране на тестови стратегии и критични потоци по EPIC-и и stories;
  - **sprint-planning** – подреждане на stories в walking skeleton-и и спринтове;
  - **implementation-readiness** – проверка дали за всеки критичен EPIC има достатъчно яснота.
- Конкретни инстанции (напр. QA4Free 2.0) трябва да:
  - избират кои EPIC-и от beelms core активират;
  - добавят свои EPIC-и и stories в отделни backlog документи;
  - пазят референция към този документ за traceability от инстанция → core.
