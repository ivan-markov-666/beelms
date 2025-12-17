# beelms core – Implementation Readiness

_Роля: Tech Lead / Architect / QA Lead. Workflow: BMAD Solutioning → Implementation Readiness._

## 1. Цел на документа

Този документ отговаря на въпроса: **„Готови ли сме да започнем реална имплементация на beelms core
(MVP) в спринтове?“**

Фокусът е върху това дали имаме достатъчно яснота за:

- обхват и приоритети (какво строим първо);
- архитектура и технически решения;
- епик-и, stories и тестов дизайн;
- среди, tooling и минимални Delivery артефакти.

## 2. Входни артефакти

- Product Brief – `docs/product/product-brief.md`
- PRD – `docs/product/prd.md`
- Technical Research – `docs/analysis/research/technical-self-hosted-lms-architecture-research-2025-12-10.md`
- UX Design – `docs/ux-design-specification.md`
- System Architecture – `docs/architecture/beelms-core-architecture.md`
- Test Design – `docs/testing/beelms-core-test-design.md`

## 3. Обхват на първата имплементационна фаза (MVP core)

### 3.1. Основни функционални области

От Product Brief §5 и PRD §4, подсилени от EPIC/STORY картата, първата фаза трябва да обхване:

- **Auth & Accounts + RBAC** – регистрация, login, профил, GDPR потоци, базова сигурност.
- **Wiki & Content** – публична wiki, статии, многоезичност, категории.
- **Courses & Learning Paths** – базови курсове и прогрес (completed/in progress).
- **Basic Assessments** – прости quizzes към уроци.
- **Admin Portal** – базов панел за съдържание, потребители и метрики.
- **DX / CLI & Infra tooling** – `npx create-beelms-app`, docker-compose стек, миграции/seed.
- **Cross-cutting:** I18N, GDPR/Legal, Metrics (минимално), Security.

### 3.2. Ясно ли е какво ОСТАВА извън първата фаза?

Да. В EPIC/STORY картата и Test Design документа са отделени Post-MVP / Later EPIC-и:

- Advanced Exams & Case Studies;
- Advanced Reporting & Dashboards;
- Shared Multi-tenant режим;
- Billing/Monetization;
- Advanced analytics & recommendations;

Това намалява риска от „scope creep“ в първата имплементационна фаза.

## 4. Архитектурна готовност

### 4.1. Backend и frontend архитектура

- **Backend:** NestJS modular monolith с ясно описани домейн модули (Auth, Users, Wiki,
  Courses, Assessments, Admin, Metrics, Integrations) – `docs/architecture/beelms-core-architecture.md` §3.
- **Frontend:** референтен Next.js UI (public + admin), описан на ниво UX потоци и шаблони –
  `docs/ux-design-specification.md`.

Заключение: за ниво „walking skeleton + последващо доразвиване“ архитектурната яснота е достатъчна.

### 4.2. Tenancy и инфраструктура

- Tenancy: single-tenant per deployment + multi-instance чрез tooling – ясно описано и валидирано
  в Brainstorm + Research + Architecture.
- Инфраструктура: Lean Tier 0 (1 VPS + Docker Compose), с опционални Redis/RabbitMQ/Prometheus/Sentry.

Заключение: архитектурата поддържа MVP нуждите и има ясно дефиниран „simple first“ подход.

## 5. Backlog и тестова готовност

### 5.1. EPIC-и и Stories

`docs/backlog/beelms-core-epics-and-stories.md` дефинира:

- MVP EPIC-и по основните домейни (Auth, Wiki, Courses, Assessments, Admin, DX,
  Cross-cutting);
- базов Story breakdown за всеки EPIC (без да влиза в прекомерни детайли).

Това дава добра база за:

- избор на първи walking skeleton-и;
- разбиване на stories на още по-малки tasks по време на sprint planning.

### 5.2. Test Design

`docs/testing/beelms-core-test-design.md` осигурява:

- ясни нива на тестване (unit, API/integration, E2E, non-functional);
- критични потоци по EPIC-и и какви нива тестове са задължителни;
- идеи за E2E сценарии, стъпвайки и на `docs/testing/playwright-scenarios/web-automation-scenarios.md` (за Auth/Wiki).

Заключение: имаме достатъчно ясна тестова стратегия за старт на имплементацията и последваща
автоматизация.

## 6. Среда за разработка и деплой (high-level)

- Очаквана минимална dev/prod среда е описана в архитектурния документ (Lean Tier 0) и в Test Design.
- На следващ етап (Delivery) трябва да се доразвият:
  - `docs/delivery/test-plan.md` – конкретни цикли и release тест стратегии;
  - `docs/delivery/release-plan.md` – процес на издаване и rollback;
  - CI/CD pipeline, стъпващ на вече съществуващите практики в репото.

За самия старт на имплементация обаче е достатъчно, че:

- deployment моделът е ясен (docker-compose + VPS);
- има план как да се поддържат dev/test/staging среди.

## 7. Отворени въпроси и допускания

### 7.1. Отворени въпроси (които НЕ блокират старта)

- Как точно ще бъдат структурирани допълнителните Delivery документи (Test Plan, Release Plan,
  Operational Readiness) – това е част от BMAD Delivery фазата.
- Кои конкретни EPIC-и ще формират първия walking skeleton (WS-1) за beelms core – това ще се
  уточни в `sprint-planning`.

### 7.2. Ключови допускания

- Екипът приема modular monolith + Lean Tier 0 като основна стартова посока за поне първите 6–12 месеца.
- beelms core ще служи като база и за бъдещи конкретни инстанции, но тези инстанции ще имат собствени
  backlog-и и Delivery планове.

## 8. Заключение: Implementation Readiness статус

На база на изброените артефакти и анализи:

- **Обхватът и приоритетите на MVP core са достатъчно ясни.**
- **Архитектурата е стабилна и съгласувана с Research/Brainstorm/UX.**
- **EPIC/STORY картата и Test Design документът дават добра основа за sprint planning и тестова стратегия.**

Следователно:

> **beelms core е в статус „Implementation Ready“ за старт на първи спринтове / walking skeleton-и.**

Следващата основна стъпка по BMAD е:

- `sprint-planning` – планиране на първите спринтове и walking skeleton-и, стъпвайки на EPIC/STORY
  картата и този Implementation Readiness документ.
