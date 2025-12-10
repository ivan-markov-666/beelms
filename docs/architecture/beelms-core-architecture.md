# beelms core – System Architecture

> Документ тип: BMAD Solutioning / Architecture. Описва **референтната архитектура** на рамката **beelms core** – не на конкретна инстанция (QA4Free и др.), а на самия продукт/рамка.
>
> Входни документи: Product Brief, PRD, Brainstorm, Technical Research, UX Design Specification.

---

## 1. Цели и ограничения на архитектурата

### 1.1. Основни цели

- Да предостави **opinionated, но проста** архитектура за хибридна LMS рамка (wiki + курсове + оценки).
- Да може да се деплойва лесно в **Lean Tier 0** сценарий (1–2 VPS, Docker Compose).
- Да поддържа множество **инстанции/приложения**, стъпили върху beelms core, без сложен multi-tenant модел в първите 6–12 месеца.
- Да позволява еволюция към по-сложни сценарии (повече интеграции, отделни услуги) без тотално пренаписване.

### 1.2. Ограничения и guiding principles

- **Simple first**:
  - Backend = **NestJS modular monolith** (един deployment, вътрешно разделен на домейн модули).
  - Frontend = **Next.js** референтен UI (публичен сайт + admin), по избор.
- **Tenancy**:
  - MVP: `single-tenant per deployment` (една инстанция = една организация/приложение).
  - Много инстанции = много deployment-и (multi-instance), управлявани чрез tooling.
- **Инфраструктура**:
  - Минимум: една VPS машина с Docker Compose (frontend, backend, PostgreSQL и др.).
  - Redis, RabbitMQ, Prometheus+Grafana, Sentry – **опционални** чрез feature toggles и конфигурация.

---

## 2. Високо ниво – компонентна архитектура

### 2.1. Основни компоненти

1. **beelms Core Backend (NestJS API)**
   - Modular monolith, разделен по домейни:
     - Auth & Users
     - Organizations / Instance Config
     - Wiki / Content
     - Courses & Learning Paths
     - Assessments & Tasks
     - Admin & Settings
     - Metrics & Monitoring API
     - Integrations (email, storage, payments, infra услуги)

2. **Reference Frontend (Next.js)**
   - Публичен сайт:
     - Home, Wiki, Course Catalog, Course Detail, Practical Lab, Auth екрани.
   - Admin панел:
     - Wiki Management, Course Management, Users, Settings, Metrics.
   - Използва REST API на core backend.

3. **Training API (опционален отделен сервис)**
   - Минимален NestJS service (както в текущия `training-api` пакет), достъпен през API Gateway/Reverse proxy.
   - Използва се за практическа среда (API demo и задачи за QA/automation тренинг).

4. **Database Layer (PostgreSQL)**
   - Една база на инстанция (single-tenant per deployment).
   - Схема с таблици за потребители, роли, статии, курсове, тестове, задачи, конфигурации и др.

5. **Optional Infrastructure Services**
   - **Redis** – cache / session store.
   - **RabbitMQ** – message broker за асинхронни процеси (нотификации, дълги задачи).
   - **Prometheus + Grafana** – monitoring и метрики.
   - **Sentry** – error tracking.

6. **npx create-beelms-app (CLI)**
   - Генерира структура на проект за нова инстанция:
     - backend (NestJS core);
     - по избор frontend (Next.js);
     - Docker Compose файлове;
     - примерни `.env` и seed данни.

### 2.2. Поток на заявките

- Клиент (браузър) → **Next.js frontend** → HTTP/HTTPS → **beelms Core Backend (NestJS)** → PostgreSQL/Redis/RabbitMQ.
- За Training API сценарии: frontend или Postman → API Gateway/Reverse proxy → Training API service.

---

## 3. Архитектура на backend-а (NestJS modular monolith)

### 3.1. Домейн модули

Основните NestJS модули (примерна структура):

- `AuthModule`
  - Регистрация, вход, JWT auth, forgotten/reset password потоци.
  - Guard-ове и интерцептори за защита на ресурсите.

- `UsersModule`
  - User профили, GDPR потоци (delete/export), роли и permissions.

- `OrgModule` / `InstanceConfigModule`
  - Настройки, branding (име, лого, цветове), активирани модули (feature toggles).

- `WikiModule`
  - Статии, версии, категории, многоезичност.

- `CoursesModule`
  - Курсове, модули (lessons/tests/tasks), enrollment, базов прогрес.

- `AssessmentsModule`
  - Въпроси, тестове, evaluation логика.

- `AdminModule`
  - Admin API за управление на съдържание, потребители, настройки и метрики.

- `MetricsModule`
  - API за агрегирани метрики, интеграция с Prometheus exporter.

- `IntegrationsModule`
  - Email providers, storage (R2/B2/S3-съвместим), webhooks.

Тези модули са в **един кодов репозиторий и един deployment**, но комуникират през **ясни интерфейси и service слоеве**, без силно преплетени зависимости.

### 3.2. Cross-cutting concerns

- **Security** – guards, interceptors, global pipes за валидация.
- **Logging** – централизирана логика (Winston / Pino), потенциален hook към Sentry.
- **Configuration** – module за конфигурации (env файлове, feature flags).
- **Error Handling** – глобален exception filter, стандартизирани error отговори.

---

## 4. Tenancy и инстанции

### 4.1. Single-tenant per deployment

- Всяка инстанция на beelms core има **собствена база данни** и собствена конфигурация.
- Един deployment обслужва **една организация / продукт** (QA платформа, корпоративна вътрешна платформа, академия и т.н.).
- Изолация на данните е на ниво база + конфигурация, без ID tenant колони навсякъде.

### 4.2. Multi-instance подход

- Множество клиенти/продукти се обслужват чрез **множество deployment-и**:
  - всеки със свой `docker-compose` стек и `.env` файлове;
  - потенциално върху една или няколко VPS машини.
- Общи tooling-и (CLI, scripts, Terraform/Ansible по избор) могат да автоматизират provisioning на нова инстанция.

### 4.3. Бъдещ multi-tenant модел (out of scope за 6–12 месеца)

- В по-далечен хоризонт може да се разгледа **shared multi-tenant** схема:
  - OrgID във всички релевантни таблици;
  - централизирано управление на много организации в една инстанция.
- Това изисква допълнителни архитектурни решения и тестване и **съзнателно е оставено за бъдещ етап**.

---

## 5. Deployment архитектура (Lean Tier 0)

### 5.1. Основен сценарий – една VPS + Docker Compose

- Контейнери:
  - `beelms-backend` (NestJS)
  - `beelms-frontend` (Next.js) – по избор; може и статично host-ване (Cloudflare Pages и др.).
  - `postgres` – основна база данни.
  - `redis` – по избор.
  - `rabbitmq` – по избор.
  - `training-api` – отделен контейнер при нужда.
  - reverse proxy (Caddy/Traefik/Nginx).

- Основни принципи:
  - един compose файл или малък набор от файлове за локална/production среда;
  - `.env` файлове дефинират connection strings, feature toggles и интеграции;
  - миграциите и seed-овете се стартират чрез CLI/скриптове.

### 5.2. Път към по-сложни среди

- При нужда от скалиране:
  - backend и training-api могат да бъдат репликирани;
  - базата може да се премести към управляван Postgres;
  - Redis/RabbitMQ могат да бъдат заместени с managed услуги.
- При достатъчно мащаб и екип:
  - миграция към Kubernetes става възможна, като отделните компоненти (backend, training-api, frontend) вече имат ясни образи и конфигурации.

---

## 6. Данни и интеграции (high level)

### 6.1. Основни домейн агрегати

- **User** – акаунт, профил, роли, GDPR статут.
- **Article** – wiki статия с версии и езикови варианти.
- **Course** – набор от модули (уроци, тестове, задачи).
- **Assessment** – тест/квиз с въпроси и резултати.
- **InstanceConfig** – настройки за инстанцията (branding, активни модули, интеграции).

Детайлният ER модел се описва в отделен документ (`db-model.md`) и не се дублира тук.

### 6.2. Интеграции

- **Email** – абстракция за mail provider (SMTP, SendGrid, др.).
- **Storage** – локална файлова система или object storage (R2/B2/S3).
- **Payments** – integration точки (webhooks, redirect потоци), без твърд vendor lock-in.
- **Monitoring** – Prometheus exporters, логове, dashboards в Grafana.
- **Error Tracking** – Sentry интеграция.

---

## 7. Сигурност, GDPR и метрики (обобщение)

- **Auth & Security**
  - JWT auth, защити срещу brute force, rate limiting за чувствителни операции.
  - CSRF/XSS/SQL injection защити според рамките на NestJS/ORM и допълнителни middleware-и.

- **GDPR**
  - API и UI потоци за delete/export на данни.
  - Конфигурируеми privacy/legal страници.

- **Метрики**
  - Минимум: агрегирани показатели (брой потребители, активни курсове и др.).
  - Възможност за разширяване към по-богати learning analytics в бъдеще.

---

## 8. Връзка с BMAD workflows

- **Create-architecture** (този документ):
  - Формализира изборите modular monolith + single-tenant + Lean Tier 0.
- **Create-epics-and-stories**:
  - Оттук могат да се извлекат архитектурни епици (Auth & RBAC, Wiki, Courses, Assessments, Admin, Integrations, Infra Tooling).
- **Validate-architecture** (по-късен етап):
  - Този документ служи като база за архитектурни ревюта, risk анализ и future decisions.

Този документ описва архитектурата на **beelms core**. Конкретни инстанции върху beelms трябва да имат свои архитектурни документи, които стъпват върху настоящия и добавят свои специфики (интеграции, UI, домейн особености).
