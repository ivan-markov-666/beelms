# Списък със Задачи (Project Backlog) - Обновена Версия

Този документ проследява разбиването на потребителските истории от `prd.md` на конкретни технически задачи, актуализиран за пълна съгласуваност с `architecture.md`.

---

# Epic 1 Foundation & Public Access - ОБНОВЕНА ВЕРСИЯ

Установява основната инфраструктура на проекта и предоставя ключовата публична функционалност, която позволява на всички посетители да достъпват лекционното съдържание. Този епик осигурява солидната основа за всички последващи функции.

---

## Story 1.1 Project Setup & Infrastructure

As a developer,
I want to establish the basic project structure and development environment,
so that the team can efficiently develop and deploy the application.

### Acceptance Criteria

- 1: Monorepo structure is created with apps/ (web, admin, backend) and packages/ (shared-types, ui-components, constants) directories
- 2: TypeScript configuration is set up across all packages with consistent settings and proper cross-package references
- 3: Shared packages (shared-types, ui-components, constants) are created with basic build setup and ready for incremental development
- 4: Package.json workspaces are configured for code sharing between apps with proper dependency resolution
- 5: First shared types are created when needed during API development (User, Category, Topic interfaces)
- 6: First shared UI components are created when needed during frontend development (Button, Card, Layout components)
- 7: PostgreSQL database is configured with basic connection and health check
- 8: Docker Compose development environment provides complete local setup including database and all services
- 9: Environment variable templates (.env.example files) are created for all apps with development defaults
- 10: Development tools (ESLint, Prettier, TypeScript) are configured consistently across all packages
- 11: Quick Start documentation in README.md with docker-compose up instructions
- 12: Basic CI/CD pipeline is configured for automated testing and deployment

### Additional Tasks

#### Task 1.1.X: Docker Local Development Setup

- [ ] docker-compose.dev.yml with PostgreSQL, backend, and frontend services with proper networking
- [ ] Environment variable templates (.env.example files for each app) with all required variables documented
- [ ] Database initialization script (scripts/init-db.sql) with basic schema setup
- [ ] Health check endpoints configured for all services (/health for backend, proper container health checks)
- [ ] Development documentation in README.md with "Quick Start" section and troubleshooting guide
- [ ] **Manual Smoke Test**:
  1. `git clone <repo> && cd qa-platform`
  2. `cp .env.example .env` (and configure basic settings)
  3. `docker-compose -f docker-compose.dev.yml up -d` → all services start
  4. `curl http://localhost:3001/health` → backend healthy
  5. `curl http://localhost:3000` → frontend loads
  6. `curl http://localhost:3002` → admin app loads
  7. **Очакван резултат**:
     - ✅ All services start successfully with one command
     - ✅ Database connection established
     - ✅ All health checks pass
     - ✅ Hot reload works for development

---

## Story 1.2 Core Data Models & Database Schema

As a developer,
I want to establish the core database schema and data models,
so that the application has a solid data foundation.

### Acceptance Criteria

- 1: Users table is created with proper authentication fields (id, email, password_hash, role, is_active, preferred_language, timestamps)
- 2: Categories table is created for organizing topics with fields (id, name, description, color_code, icon_name, sort_order, is_active)
- 3: Topics table is created for individual learning content metadata (id, category_id, topic_number, name, slug, estimated_reading_time, is_published)
- 4: TopicContent table is created for multi-language lesson content with fields (topic_id, language_code, title, content, search_vector, meta_description)
- 5: All tables have proper UUID primary keys, timestamps (created_at, updated_at), and foreign key relationships with cascading deletes
- 6: TypeORM entities are created matching the database schema with proper decorators and relationships
- 7: Database migrations are set up for schema versioning and development workflow using TypeORM migration system
- 8: Full-text search functionality is implemented on TopicContent.content field with PostgreSQL FTS tsvector indexes and GIN indexing
- 9: Unique constraints are properly defined (email uniqueness, topic_id+language_code uniqueness, category_id+topic_number uniqueness)
- 10: Database seed script creates initial categories and sample content for development testing

---

## Story 1.3 Basic API Foundation

As a developer,
I want to establish the basic NestJS API structure,
so that frontend applications can communicate with the backend.

**Dependencies**: Requires database schema from Story 1.2

### Acceptance Criteria

- 1: NestJS application boots successfully with proper module structure (AppModule, DatabaseModule, ConfigModule) and TypeORM integration
- 2: Global validation pipe is configured with class-validator for input validation and proper error formatting
- 3: CORS is configured to allow requests from frontend applications (apps/web on port 3000 and apps/admin on port 3002)
- 4: Health check endpoint (/health) returns database connectivity status, service uptime, and basic system info (memory, environment)
- 5: Global exception filter provides consistent error responses following architecture format with error codes, messages, timestamps
- 6: Request logging is implemented with structured JSON format using pino logger including request ID, method, URL, response time
- 7: Rate limiting is configured globally: 100 requests/minute per IP for general endpoints, 10 requests/minute for auth endpoints
- 8: Stricter security limits for sensitive operations: 3 login attempts per 15 minutes per IP address
- 9: TypeORM repositories are properly configured for all entities (User, Category, Topic, TopicContent) with dependency injection
- 10: Environment configuration module loads and validates all required environment variables (DATABASE_URL, JWT_SECRET, etc.)

---

## Story 1.4 Public Content API Endpoints

As a guest user,
I want to access course and lesson content through API endpoints,
so that I can browse educational content without registration.

**Dependencies**: Requires API foundation from Story 1.3

### Acceptance Criteria

- 1: GET /categories endpoint returns list of all active categories with proper DTO response (displayed as "courses" in UI)
- 2: GET /courses endpoint returns list of all courses with filtering and pagination support (aliased to categories for UI compatibility)
- 3: GET /courses/:id endpoint returns detailed course information including all published topics in sequential order (maps to category)
- 4: GET /categories endpoint supports optional filtering by is_active status and proper sorting by sort_order
- 5: GET /categories/:id endpoint returns detailed category information including all published topics in sequential order
- 6: GET /topics/:id endpoint returns complete topic content in requested language (default: bg) with fallback mechanism
- 7: GET /topics/:id endpoint supports language query parameter (?lang=en) for multi-language content retrieval
- 8: All endpoints return proper HTTP status codes: 200 for success, 404 for non-existent resources, 400 for invalid parameters
- 9: Response DTOs are implemented in shared-types package for consistent API contracts between frontend and backend
- 10: OpenAPI/Swagger documentation is generated for all public endpoints with proper descriptions, examples, and response schemas
- 11: Endpoints implement proper caching headers for static content (categories, published topics) to improve performance
- 12: API responses include pagination metadata where applicable and consistent error handling for malformed requests

---

## Story 1.5 React Public Application Setup

As a guest user,
I want to access a responsive web application,
so that I can browse courses and topics on any device.

**Dependencies**: Requires shared packages from Story 1.1

### Acceptance Criteria

- 1: React application (apps/web) bootstraps successfully with Vite, TypeScript, and React Router configuration
- 2: Mantine UI is integrated and configured with custom theme matching design requirements
- 3: React Router is configured for client-side navigation with proper route structure (/, /courses, /courses/:id, /topics/:id)
- 4: Shared UI components from `packages/ui-components` are integrated and functional (Button, Card, Layout components)
- 5: Shared types from `packages/shared-types` are imported and used for API response typing and component props
- 6: Responsive layout component provides consistent structure across pages using Mantine Grid system
- 7: HTTP client (axios) is configured with base URL, timeout settings, and comprehensive error interceptors
- 8: Home page displays welcome content, platform overview, and featured categories using shared components
- 9: Error boundary components are implemented for graceful error handling with user-friendly fallback UI
- 10: Loading states and skeleton components are established for smooth user experience during API calls
- 11: Basic SEO optimization with proper meta tags, page titles, and Open Graph tags for social sharing

---

## Story 1.6 Course Catalog & Navigation

As a guest user,
I want to browse available courses organized by categories,
so that I can find relevant learning content.

**Dependencies**: Requires API endpoints from Story 1.4 and React app from Story 1.5

### Acceptance Criteria

- 1: Courses page (/courses) displays all categories in card format with title, description, topic count, and estimated duration
- 2: Category cards show visual indicators: color-coded themes, icons, difficulty indicators, and completion estimates
- 3: Category filtering allows users to filter by difficulty, estimated time, and topic availability with responsive filter UI
- 4: Search functionality allows finding categories by title or description with client-side implementation and highlight matching
- 5: Course detail page (/courses/:id) shows complete topic list in sequential order with progress indicators and reading estimates (fetches from GET /categories/:id)
- 6: Topic links from course page navigate to individual topic content with proper routing and state management
- 7: Breadcrumb navigation helps users understand current location (Home > Courses > Course Name > Topic Name) with proper linking
- 8: Loading states are displayed during API calls with skeleton loaders matching final content structure
- 9: Error handling provides user-friendly messages for failed requests with retry options and fallback content
- 10: Mobile-responsive design ensures optimal viewing experience across devices with touch-friendly interactions
- 11: Course cards include metadata: number of topics, estimated completion time, difficulty level, and visual preview

---

## Story 1.7 Topic Content Display

As a guest user,
I want to read individual topic content in a clean, readable format,
so that I can learn effectively without distractions.

**Dependencies**: Requires course catalog from Story 1.6

### Acceptance Criteria

- 1: Topic page (/topics/:id) displays content with proper typography, spacing, and readability optimized formatting
- 2: Content supports Markdown rendering for rich text formatting including code blocks, lists, links, and emphasis
- 3: Navigation between topics within the same category is available with previous/next buttons and keyboard shortcuts
- 4: Reading progress indicator shows scroll position within the topic content with estimated time remaining
- 5: Topics are displayed in proper sequential order as defined in category structure with clear numbering
- 6: Language selection is available for topics with multiple translations (bg/en/de) with fallback to default language
- 7: Topic metadata is displayed appropriately: estimated reading time, difficulty level, last updated date
- 8: Responsive design ensures optimal readability on mobile and desktop with appropriate font scaling and line spacing
- 9: Error handling gracefully manages missing content, malformed markdown, and translation unavailability
- 10: Content includes proper semantic HTML structure for accessibility and SEO optimization
- 11: Table of contents generation for longer topics with smooth scrolling navigation to sections
- 12: Print-friendly CSS styles for users who want to print content for offline reading

---

## ✅ EPIC 1 STATUS: APPROVED FOR DEVELOPMENT

### 🎯 Key Changes Made:

1. **Database Schema**: Clarified Topics + TopicContent separation per architecture
2. **API Endpoints**: Aligned with architecture - /categories endpoints with /courses UI alias for better UX
3. **Shared Packages**: Implemented "build as needed" approach for practical development
4. **Docker Setup**: Added comprehensive local development environment
5. **Rate Limiting**: Specified concrete, security-focused limits
6. **Course Terminology**: Categories displayed as "courses" in UI while maintaining proper API structure

### 📋 Ready for Development:

- All dependencies clearly mapped
- Manual smoke tests defined for each story
- Architecture alignment verified
- Technical specifications complete

### 🔄 Next Steps:

1. Begin with Story 1.1 - Project Setup & Infrastructure
2. Proceed sequentially through stories due to dependencies
3. Estimated completion: 2 weeks for full Epic 1
4. Epic 2 can begin after Story 1.5 completes (authentication requires frontend foundation)

---

## Epic 2: User Authentication & Management

### Story 2.1: User Registration

_As a new user, I want to be able to register for an account, so that I can access personalized features._

#### Задачи (Tasks):

- **Task 2.1.1: Създаване на Authentication Module (Backend)**
  - [ ] Създаване на `AuthModule` в `apps/api`.
  - [ ] Инсталиране на необходимите пакети: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`.
  - [ ] Създаване на `AuthService` и `AuthController`.
  - [ ] Имплементиране на логика за хеширане на пароли с `bcrypt` в `UserService` или `AuthService`.
  - [ ] **Unit Test**: Добавяне на тестове за Authentication Module, за да се провери дали работи правилно.
  - [ ] **Security Test**: Password hashing security тестове
  - [ ] **Integration Test**: Module integration с другите системи
  - **Документация:**
    - **README.md**: Описание на `AuthModule` и неговите отговорности. Обяснение на security практиките.
    - **TESTS.md**: Документиране на unit тестовете за `AuthModule`.

- **Task 2.1.2: Имплементиране на Registration Endpoint (Backend)**
  - [ ] Създаване на `POST /auth/register` ендпойнт.
  - [ ] Създаване на `RegisterUserDto` с валидация за `email`, `password`, `firstName`, `lastName`.
  - [ ] Имплементиране на логика в `AuthService` за проверка дали потребител с такъв имейл вече съществува.
  - [ ] Създаване на нов потребител в базата данни при успешна валидация.
  - [ ] Връщане на новосъздадения потребителски обект (без паролата).
  - [ ] Добавяне на @Api... декоратори за Swagger документация.
  - [ ] **Integration Test**: Добавяне на тестове за Registration Endpoint, за да се провери дали работи правилно.
  - [ ] **Security Test**: SQL injection и XSS protection тестове
  - [ ] **Validation Test**: Edge cases за email и password validation
  - [ ] **Manual Smoke Test**:
    1. `cd apps/api && npm run start:dev`
    2. `curl -X POST http://localhost:3001/auth/register -d '{"email":"test@example.com","password":"password123","firstName":"John","lastName":"Doe"}' -H "Content-Type: application/json"`
    3. Check response → 201 Created с user object (без password)
    4. `curl -X POST http://localhost:3001/auth/register -d '{"email":"test@example.com","password":"different"}' -H "Content-Type: application/json"`
    5. Check response → 400 Bad Request за duplicate email
    6. Check database → user запазен с hashed password
    7. **Очакван резултат**:
       - ✅ Успешна регистрация връща user data без password
       - ✅ Duplicate email detection работи
       - ✅ Password се hashing правилно в DB
       - ✅ Validation errors са clear и полезни
  - **Документация:**
    - **README.md**: Документиране на `POST /auth/register` ендпойнта с примери за usage.
    - **TESTS.md**: Документиране на integration теста за регистрация, включително случаи на успех и грешка (дублиран имейл).

- **Task 2.1.3: Създаване на Registration Page (Frontend)**
  - [ ] Създаване на нова страница/рут `/register` в `apps/web`.
  - [ ] Създаване на компонент за регистрационна форма с полета за имейл, парола, име и фамилия.
  - [ ] Имплементиране на клиентска валидация на формата.
  - [ ] **Component Test**: Добавяне на тестове за регистрационната форма, за да се провери дали работи правилно.
  - [ ] **Accessibility Test**: Screen reader и keyboard navigation тестове
  - [ ] **Responsive Test**: Mobile/desktop layout тестове
  - [ ] **Manual Smoke Test**:
    1. `cd apps/web && npm run dev` (frontend running on port 3000)
    2. Navigate to `http://localhost:3000/register`
    3. Fill form with valid data → form accepts input
    4. Submit with empty fields → validation errors appear
    5. Test responsive behavior → form works on mobile viewport
    6. **Очакван резултат**:
       - ✅ Form renders correctly across devices
       - ✅ Client-side validation works
       - ✅ Accessibility features functional
  - **Документация:**
    - **README.md**: Описание на компонента за регистрационна форма и неговите валидации.
    - **TESTS.md**: Документиране на component теста за формата за регистрация (проверка на валидации и състояние).

- **Task 2.1.4: Интеграция на формата за регистрация с API (Frontend)**
  - [ ] При изпращане на формата, извикване на `POST /auth/register` ендпойнта.
  - [ ] Обработка на успешна регистрация (напр. показване на съобщение за успех и пренасочване към страницата за вход).
  - [ ] Обработка на грешки от API-то (напр. показване на съобщение "Потребител с този имейл вече съществува").
  - [ ] **E2E Test**: Добавяне на тест, който симулира целия процес: потребителят попълва формата за регистрация, изпраща я и проверява за съобщение за успех.
  - [ ] **Error Handling Test**: Тестове за различни error scenarios
  - [ ] **Network Test**: Offline/slow connection behavior тестове
  - [ ] **Manual Smoke Test**:
    1. Backend running on port 3001, frontend on port 3000
    2. Navigate to `/register`, fill valid form, submit
    3. Should see success message → "Registration successful"
    4. Should redirect to login page
    5. Try duplicate email → error message appears
    6. Check network tab → proper API calls made
    7. **Очакван резултат**:
       - ✅ Successful registration flow works end-to-end
       - ✅ Error handling provides clear user feedback
       - ✅ Navigation flow логичен
  - **Документация:**
    - **README.md**: Описание на логиката за интеграция с API-то, включително обработка на успехи и грешки.
    - **TESTS.md**: Документиране на E2E теста за процеса на регистрация от край до край.

---

### Story 2.2: User Login

_As a registered user, I want to be able to log in to my account, so that I can access my personalized content and features._

#### Задачи (Tasks):

- **Task 2.2.1: Имплементиране на JWT Стратегия (Backend)**
  - [ ] Конфигуриране на `JwtModule` в `AuthModule` със секретен ключ и време на валидност (`expiresIn`), заредени от `.env` файла.
  - [ ] Създаване на `JwtStrategy` (`jwt.strategy.ts`), която валидира payload-а на токена.
  - [ ] Имплементиране на `LocalStrategy` (`local.strategy.ts`) за валидиране на потребителско име и парола.
  - [ ] **Unit Test**: Добавяне на тестове за JWT стратегията, за да се провери дали работи правилно.
  - [ ] **Security Test**: Token validation и expiration тестове
  - [ ] **Performance Test**: Token generation/validation performance тестове
  - **Документация:**
    - **README.md**: Описание на `JwtStrategy` и `LocalStrategy`. JWT security configuration.
    - **TESTS.md**: Документиране на unit тестовете за стратегиите за автентикация.

- **Task 2.2.2: Имплементиране на Login Endpoint (Backend)**
  - [ ] Създаване на `POST /auth/login` ендпойнт, защитен с `LocalAuthGuard`.
  - [ ] Създаване на `LoginUserDto` с `email` и `password`.
  - [ ] При успешна автентикация, `AuthService` трябва да генерира и върне `access_token` и `refresh_token`.
  - [ ] **КРИТИЧНО**: Refresh token трябва да се съхранява в httpOnly cookie за security
  - [ ] Добавяне на @Api... декоратори за Swagger документация.
  - [ ] **Integration Test**: Добавяне на тестове за Login Endpoint, за да се провери дали работи правилно.
  - [ ] **Security Test**: Brute force protection и rate limiting тестове
  - [ ] **Token Test**: Access/refresh token lifecycle тестове
  - [ ] **Manual Smoke Test**:
    1. Ensure user exists from registration test
    2. `curl -X POST http://localhost:3001/auth/login -d '{"email":"test@example.com","password":"password123"}' -H "Content-Type: application/json"`
    3. Check response → 200 OK with access_token
    4. Check Set-Cookie header → refresh_token в httpOnly cookie
    5. Try invalid credentials → 401 Unauthorized
    6. **Очакван резултат**:
       - ✅ Valid credentials return tokens
       - ✅ Refresh token в secure httpOnly cookie
       - ✅ Invalid credentials properly rejected
  - **Документация:**
    - **README.md**: Документиране на `POST /auth/login` ендпойнта и обяснение на връщаните токени.
    - **TESTS.md**: Документиране на integration теста за логин процеса.

- **Task 2.2.3: Създаване на Login Page (Frontend)**
  - [ ] Създаване на нова страница/рут `/login` в `apps/web`.
  - [ ] Създаване на компонент за форма за вход с полета за имейл и парола.
  - [ ] Имплементиране на клиентска валидация на формата.
  - [ ] **Component Test**: Добавяне на тестове за формата за вход, за да се провери дали работи правилно.
  - [ ] **Accessibility Test**: Form accessibility compliance тестове
  - [ ] **UX Test**: User experience flow тестове
  - [ ] **Manual Smoke Test**:
    1. Navigate to `http://localhost:3000/login`
    2. Form renders correctly with email/password fields
    3. Client validation works for empty/invalid fields
    4. Form accessible via keyboard navigation
    5. **Очакван резултат**:
       - ✅ Login form functional и accessible
       - ✅ Validation feedback clear
  - **Документация:**
    - **README.md**: Описание на компонента за форма за вход.
    - **TESTS.md**: Документиране на component теста за формата за вход.

- **Task 2.2.4: Интеграция на формата за вход с API (Frontend)**
  - [ ] При изпращане на формата, извикване на `POST /auth/login`.
  - [ ] При успешен отговор, съхраняване на `access_token` в memory и `refresh_token` автоматично в cookie.
  - [ ] Конфигуриране на `axios` клиента да изпраща `Authorization: Bearer <token>` хедър с всяка следваща заявка.
  - [ ] Пренасочване на потребителя към неговото табло (`/dashboard`) след успешен вход.
  - [ ] Обработка на грешки (напр. "Грешен имейл или парола").
  - [ ] **E2E Test**: Добавяне на тест, който симулира целия процес: потребителят попълва формата за вход, изпраща я и проверява дали е пренасочен към таблото (`/dashboard`).
  - [ ] **Session Test**: Token persistence и automatic refresh тестове
  - [ ] **Navigation Test**: Post-login navigation flow тестове
  - [ ] **Manual Smoke Test**:
    1. With valid registered user from previous tests
    2. Fill login form, submit → success message
    3. Redirected to `/dashboard` page
    4. Check localStorage → access_token stored
    5. Check network requests → Authorization header present
    6. Try invalid login → error message displayed
    7. **Очакван резултат**:
       - ✅ Successful login redirects to dashboard
       - ✅ Tokens stored securely
       - ✅ API requests include auth headers
       - ✅ Error handling functional
  - **Документация:**
    - **README.md**: Описание на логиката за съхранение на токени и пренасочване след успешен вход.
    - **TESTS.md**: Документиране на E2E теста за процеса на вход от край до край.

---

### Story 2.3: Secure Session & Access Control

_As a logged-in user, I want my session to be secure and to be able to log out, so that my account is protected._

#### Задачи (Tasks):

- **Task 2.3.1: Имплементиране на защитени маршрути (Backend)**
  - [ ] Прилагане на `JwtAuthGuard` към ендпойнти, които изискват автентикация (напр. `GET /profile`).
  - [ ] Създаване на къстъм декоратор `@GetUser()`, който да се използва за лесно извличане на потребителския обект от `request`-а.
  - [ ] Създаване на `GET /auth/profile` ендпойнт, който връща информация за текущо логнатия потребител.
  - [ ] Добавяне на @Api... декоратори за Swagger документация.
  - [ ] **Integration Test**: Добавяне на тест, който се опитва да достъпи защитен ендпойнт (напр. `/auth/profile`) без токен и с невалиден токен, като проверява за `401 Unauthorized` отговор.
  - [ ] **Security Test**: Token tampering и expiration тестове
  - [ ] **Authorization Test**: Different user access control тестове
  - [ ] **Manual Smoke Test**:
    1. `curl http://localhost:3001/auth/profile` → 401 Unauthorized (no token)
    2. `curl -H "Authorization: Bearer invalid_token" http://localhost:3001/auth/profile` → 401 Unauthorized
    3. Get valid token from login, then: `curl -H "Authorization: Bearer <valid_token>" http://localhost:3001/auth/profile` → 200 OK with user data
    4. **Очакван резултат**:
       - ✅ Unprotected access properly blocked
       - ✅ Valid tokens grant access
       - ✅ User data returned securely
  - **Документация:**
    - **README.md**: Документиране на `GET /auth/profile` и обяснение как се защитават ендпойнти.
    - **TESTS.md**: Документиране на integration теста за `JwtAuthGuard`, който валидира защитата на ендпойнтите.

- **Task 2.3.2: Имплементиране на Refresh Token механизъм (Backend)**
  - [ ] Създаване на `POST /auth/refresh` ендпойнт.
  - [ ] Логиката трябва да приема `refresh_token`, да го валидира и ако е валиден, да издава нов `access_token`.
  - [ ] При логин, `refresh_token` трябва да се съхранява в базата данни (хеширан) и да се свързва с потребителя, за да може да бъде оттеглен (revoked).
  - [ ] Създаване на `POST /auth/logout` endpoint за revoke на refresh tokens
  - [ ] Добавяне на @Api... декоратори за Swagger документация.
  - [ ] **Integration Test**: Добавяне на тестове за Refresh Token механизма, за да се провери дали работи правилно.
  - [ ] **Security Test**: Token rotation и revocation тестове
  - [ ] **Concurrency Test**: Multiple refresh attempts тестове
  - [ ] **Manual Smoke Test**:
    1. Login to get tokens
    2. Wait for access token to expire (or use short expiry for test)
    3. `curl -X POST http://localhost:3001/auth/refresh` (with refresh token cookie) → new access_token
    4. `curl -X POST http://localhost:3001/auth/logout` → refresh token revoked
    5. Try refresh with revoked token → 401 Unauthorized
    6. **Очакван резултат**:
       - ✅ Refresh mechanism works seamlessly
       - ✅ Logout properly revokes tokens
       - ✅ Revoked tokens cannot be reused
  - **Документация:**
    - **README.md**: Документиране на `POST /auth/refresh` и logout ендпойнтите.
    - **TESTS.md**: Документиране на integration теста за опресняване на токени.

- **Task 2.3.3: Имплементиране на защитени маршрути (Frontend)**
  - [ ] Създаване на компонент `ProtectedRoute`, който проверява за наличието на `access_token`.
  - [ ] Ако няма токен, потребителят се пренасочва към `/login`.
  - [ ] Обновяване на рутирането, за да се използва `ProtectedRoute` за страници като `/dashboard`.
  - [ ] **Component Test**: Добавяне на тестове за защитените маршрути, за да се провери дали работят правилно.
  - [ ] **Navigation Test**: Route protection flow тестове
  - [ ] **State Test**: Authentication state management тестове
  - [ ] **Manual Smoke Test**:
    1. Clear all tokens/cookies
    2. Try to access `http://localhost:3000/dashboard` → redirected to `/login`
    3. Login successfully → can access protected routes
    4. **Očakван резултат**:
       - ✅ Unauthenticated users redirected properly
       - ✅ Authenticated users can access protected content
  - **Документация:**
    - **README.md**: Описание на компонента `ProtectedRoute` и неговата роля.
    - **TESTS.md**: Документиране на component тестовете за `ProtectedRoute`.

- **Task 2.3.4: Имплементиране на Logout и Token Refresh (Frontend)**
  - [ ] Създаване на `useAuth` hook, който предоставя информация за потребителя и статус на автентикация.
  - [ ] Имплементиране на бутон/линк за изход, който изчиства токените от хранилището и пренасочва към началната страница.
  - [ ] Имплементиране на логика в `axios` interceptor, която при грешка `401 Unauthorized` автоматично да се опитва да обнови токена чрез `/auth/refresh` ендпойнта.
  - [ ] **Integration Test**: Добавяне на тестове за Logout и Token Refresh, за да се провери дали работят правилно.
  - [ ] **State Management Test**: Auth state consistency тестове
  - [ ] **Auto-refresh Test**: Automatic token refresh flow тестове
  - [ ] **Manual Smoke Test**:
    1. Login and access dashboard
    2. Click logout button → redirected to homepage, tokens cleared
    3. Try to access protected route → redirected to login
    4. Login again, let access token expire → automatic refresh should work
    5. **Очакван резултат**:
       - ✅ Logout clears session completely
       - ✅ Auto-refresh works transparently
       - ✅ Auth state consistent across app
  - **Документация:**
    - **README.md**: Описание на `useAuth` hook-а и логиката за опресняване на токени.
    - **TESTS.md**: Документиране на integration тестовете за изход и опресняване на токен.

---

### Story 2.4: Role-Based Access Control (RBAC)

_As an administrator, I want to have special permissions, so that I can manage the platform content and users._

#### Задачи (Tasks):

- **Task 2.4.1: Имплементиране на Roles Guard (Backend)**
  - [ ] Дефиниране на `Role` enum в `packages/shared-types` (напр. `ADMIN`, `USER`).
  - [ ] Създаване на `@Roles()` декоратор, който да се използва за задаване на изискваните роли за даден ендпойнт.
  - [ ] Създаване на `RolesGuard`, който проверява дали ролята на потребителя отговаря на изискваните роли, дефинирани с `@Roles()` декоратора.
  - [ ] Прилагане на `RolesGuard` глобално или на специфични модули.
  - [ ] **Unit Test**: Добавяне на тестове за логиката в `RolesGuard`.
  - [ ] **Integration Test**: Добавяне на тест, който проверява дали ендпойнт, защитен с `@Roles('ADMIN')`, е недостъпен за потребител с роля `USER` и достъпен за `ADMIN`.
  - [ ] **Security Test**: Role escalation prevention тестове
  - [ ] **Edge Case Test**: Multiple roles и role inheritance тестове
  - **Документация:**
    - **README.md**: Обяснение на системата за роли (RBAC) и как се използва `@Roles()` декораторът.
    - **TESTS.md**: Документиране на unit и integration тестовете за `RolesGuard`, покриващи както вътрешната логика, така и реалното приложение върху ендпойнти.

- **Task 2.4.2: Защита на административни ендпойнти (Backend)**
  - [ ] Създаване на примерен ендпойнт `GET /admin/stats`, който е защитен с `@Roles('ADMIN')`.
  - [ ] Добавяне на @Api... декоратори за Swagger документация.
  - [ ] **Integration Test**: Добавяне на тестове за административните ендпойнти, за да се провери дали работят правилно.
  - [ ] **Security Test**: Non-admin access denial тестове
  - [ ] **Authorization Test**: Admin permission validation тестове
  - [ ] **Manual Smoke Test**:
    1. Login as regular user → get access token
    2. `curl -H "Authorization: Bearer <user_token>" http://localhost:3001/admin/stats` → 403 Forbidden
    3. Login as admin user → get admin access token
    4. `curl -H "Authorization: Bearer <admin_token>" http://localhost:3001/admin/stats` → 200 OK with stats
    5. **Очакван резултат**:
       - ✅ Regular users blocked from admin endpoints
       - ✅ Admin users can access admin endpoints
       - ✅ Proper HTTP status codes returned
  - **Документация:**
    - **README.md**: Документиране на примерния административен ендпойнт.
    - **TESTS.md**: Документиране на integration теста, който проверява достъпа до защитени с роля ендпойнти.

- **Task 2.4.3: Управление на достъпа в UI (Frontend)**
  - [ ] `useAuth` hook-а трябва да предоставя и ролята на текущия потребител.
  - [ ] Създаване на компонент `AdminRoute`, който защитава страници в админ панела и пренасочва потребители без `ADMIN` роля.
  - [ ] Имплементиране на условно рендиране на UI елементи (напр. бутон "Админ Панел" в хедъра се показва само на администратори).
  - [ ] **Component Test**: Добавяне на тестове за управлението на достъпа в UI, за да се провери дали работи правилно.
  - [ ] **Role Visibility Test**: Conditional rendering based on roles тестове
  - [ ] **Navigation Test**: Admin route protection тестове
  - [ ] **Manual Smoke Test**:
    1. Login as regular user → admin buttons/links not visible
    2. Try to access `/admin` directly → redirected or access denied
    3. Login as admin → admin interface accessible
    4. **Очакван резултат**:
       - ✅ UI adapts based on user role
       - ✅ Admin features hidden from regular users
       - ✅ Admin routes properly protected
  - **Документация:**
    - **README.md**: Описание на компонента `AdminRoute` и условното рендиране на база роля.
    - **TESTS.md**: Документиране на component тестовете за UI елементи, свързани с роли.

---

### Story 2.5: Email Service Integration

_As a user, I want to receive email confirmations and notifications, so that I can verify my account and stay informed._

#### Задачи (Tasks):

- **Task 2.5.1: SendGrid Integration Setup (Backend)**
  - [ ] Инсталиране на `@sendgrid/mail` в backend приложението
  - [ ] Създаване на `EmailModule` и `EmailService`
  - [ ] Конфигуриране на SendGrid API key в environment variables
  - [ ] Имплементиране на email templates за registration, password reset
  - [ ] Създаване на rate limiting логика (90 emails/day soft limit според architecture)
  - [ ] Добавяне на fallback mechanism при достигнат limit
  - [ ] **Unit Test**: Тест за email template generation и rate limiting логика
  - [ ] **Integration Test**: Тест за SendGrid API integration (с mock в test environment)
  - [ ] **Rate Limit Test**: Email daily limit enforcement тестове
  - [ ] **Fallback Test**: Fallback mechanism при API failures
  - **Документация:**
    - **README.md**: Добавяне на секция "Email Configuration" с настройки за SendGrid
    - **TESTS.md**: Документиране на email service тестовете

- **Task 2.5.2: Email Confirmation for Registration (Backend)**
  - [ ] Модификация на registration endpoint да изпраща confirmation email
  - [ ] Създаване на `POST /auth/confirm-email` endpoint за потвърждаване
  - [ ] User entity update - добавяне на `emailConfirmed` boolean field и `emailConfirmationToken`
  - [ ] Генериране на email confirmation tokens
  - [ ] **Integration Test**: Тест за цялостния email confirmation flow
  - [ ] **Security Test**: Token security и expiration тестове
  - [ ] **Email Test**: Email delivery и template тестове
  - [ ] **Manual Smoke Test**:
    1. `POST /auth/register` с valid data → 201 Created
    2. Check email service logs → confirmation email sent
    3. Extract confirmation token from logs/database
    4. `GET /auth/confirm-email?token=<token>` → user activated
    5. Login with confirmed account → success
    6. **Очакван резултат**:
       - ✅ Registration triggers email sending
       - ✅ Email confirmation activates account
       - ✅ Unconfirmed accounts have limited access
  - **Документация:**
    - **README.md**: Описание на email confirmation процеса
    - **TESTS.md**: Документиране на email confirmation тестовете

- **Task 2.5.3: Password Reset Functionality (Backend + Frontend)**
  - [ ] Създаване на `POST /auth/forgot-password` endpoint
  - [ ] Създаване на `POST /auth/reset-password` endpoint
  - [ ] Password reset tokens в database със expiration
  - [ ] Frontend страница `/forgot-password` за заявка на reset
  - [ ] Frontend страница `/reset-password` за нова парола
  - [ ] **E2E Test**: Цялостен password reset flow
  - [ ] **Security Test**: Reset token security тестове
  - [ ] **UI Test**: Password reset interface тестове
  - [ ] **Manual Smoke Test**:
    1. Navigate to `/forgot-password` page
    2. Enter email address → success message
    3. Check email logs → reset email sent
    4. Extract reset token from logs
    5. Navigate to `/reset-password?token=<token>`
    6. Enter new password → success message
    7. Login with new password → success
    8. **Очакван резултат**:
       - ✅ Password reset flow works end-to-end
       - ✅ Old password no longer works
       - ✅ Reset tokens expire properly
  - **Документация:**
    - **README.md**: Описание на password reset функционалността
    - **TESTS.md**: Документиране на password reset тестовете

---

### Story 2.6: Course Enrollment System

_As a logged-in user, I want to enroll in courses, so that I can track my progress and access premium features._

#### Задачи (Tasks):

- **Task 2.6.1: Course Enrollment Database Design (Backend)**
  - [ ] Създаване на `UserCourseEnrollment` entity:

    ```typescript
    @Entity('user_course_enrollments')
    export class UserCourseEnrollment {
      @PrimaryGeneratedColumn('uuid')
      id: string;

      @Column('uuid')
      userId: string;

      @Column('uuid')
      courseId: string;

      @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
      enrolledAt: Date;

      @Column({ default: 0 })
      progressPercentage: number;

      @Unique(['userId', 'courseId'])
      userCourseUnique: string;
    }
    ```

  - [ ] Database migration за новата таблица
  - [ ] **Integration Test**: CRUD operations за enrollment entity
  - [ ] **Data Integrity Test**: Constraint и unique validation тестове
  - [ ] **Performance Test**: Enrollment query performance тестове
  - **Документация:**
    - **README.md**: Описание на enrollment database schema
    - **TESTS.md**: Документиране на enrollment entity тестовете

- **Task 2.6.2: Course Enrollment API Endpoints (Backend)**
  - [ ] Създаване на `POST /courses/:id/enroll` endpoint (protected)
  - [ ] Създаване на `DELETE /courses/:id/unenroll` endpoint (protected)
  - [ ] Създаване на `GET /users/me/enrollments` endpoint (protected)
  - [ ] Модификация на `GET /users/me/progress` да връща само enrolled courses
  - [ ] Модификация на `GET /courses` да включва enrollment status за authenticated users
  - [ ] **Integration Test**: Enrollment/unenrollment flow тестове
  - [ ] **Security Test**: User isolation и permission тестове
  - [ ] **Business Logic Test**: Duplicate enrollment prevention тестове
  - [ ] **Manual Smoke Test**:
    1. Login as user → get access token
    2. `curl -H "Authorization: Bearer <token>" -X POST http://localhost:3001/courses/1/enroll` → 201 Created
    3. `curl -H "Authorization: Bearer <token>" http://localhost:3001/users/me/enrollments` → course appears in list
    4. `curl -H "Authorization: Bearer <token>" http://localhost:3001/courses` → course shows as enrolled
    5. `curl -H "Authorization: Bearer <token>" -X DELETE http://localhost:3001/courses/1/unenroll` → 200 OK
    6. `curl -H "Authorization: Bearer <token>" http://localhost:3001/users/me/enrollments` → course removed
    7. **Очакван резултат**:
       - ✅ Enrollment/unenrollment works correctly
       - ✅ User can only see their own enrollments
       - ✅ Course status updates properly
  - **Документация:**
    - **README.md**: Документиране на enrollment API endpoints
    - **TESTS.md**: Документиране на enrollment API тестовете

- **Task 2.6.3: Course Enrollment UI (Frontend)**
  - [ ] Добавяне на "Запиши се в курса" бутон на course detail pages
  - [ ] Условно показване на бутон (enrolled vs not enrolled vs login required)
  - [ ] Обновяване на dashboard да показва само enrolled courses
  - [ ] Показване на enrollment count на course cards
  - [ ] **Component Test**: Enrollment button component tests
  - [ ] **State Management Test**: Enrollment state updates тестове
  - [ ] **E2E Test**: User enrollment journey от course page до dashboard
  - [ ] **Manual Smoke Test**:
    1. Navigate to course page as guest → "Login to enroll" message
    2. Login, navigate to course page → "Запиши се" button visible
    3. Click "Запиши се" → success message, button changes to "Записан"
    4. Navigate to dashboard → course appears in enrolled list
    5. Go back to course → "Уnenroll" option available
    6. **Очакван резултат**:
       - ✅ Enrollment UI works across different user states
       - ✅ Dashboard shows only enrolled courses
       - ✅ UI state updates immediately after enrollment
  - **Документация:**
    - **README.md**: Описание на enrollment UI components
    - **TESTS.md**: Документиране на enrollment UI тестовете

---

## Epic 3: User Dashboard & Progress Tracking

### Story 3.1: User Dashboard

_As a logged-in user, I want to see a personalized dashboard, so that I can easily view my enrolled courses and track my progress._

#### Задачи (Tasks):

- **Task 3.1.1: Създаване на Dashboard Endpoint (Backend)**
  - [ ] Създаване на `DashboardModule` и `DashboardController`.
  - [ ] Имплементиране на `GET /dashboard` ендпойнт, защитен с `JwtAuthGuard`.
  - [ ] `DashboardService` трябва да извлича всички курсове, в които потребителят се е записал, заедно с неговия напредък за всеки курс.
  - [ ] Включване на статистики: total enrolled courses, completed lessons, test scores
  - [ ] Добавяне на @Api... декоратори за Swagger документация.
  - [ ] **Integration Test**: Добавяне на тест, който проверява дали ендпойнтът връща коректни данни за логнат потребител.
  - [ ] **Performance Test**: Dashboard data aggregation performance (<200ms)
  - [ ] **Data Accuracy Test**: Progress calculation validation тестове
  - [ ] **Manual Smoke Test**:
    1. Login as user with enrolled courses
    2. `curl -H "Authorization: Bearer <token>" http://localhost:3001/dashboard` → 200 OK
    3. Response includes: enrolledCourses array, progressStats, recentActivity
    4. Verify progress percentages are accurate
    5. **Очакван резултат**:
       - ✅ Dashboard data comprehensive и accurate
       - ✅ Performance meets requirements
       - ✅ Only user's own data returned
  - **Документация:**
    - **README.md**: Документиране на `GET /dashboard` ендпойнта, включително очаквания формат на отговора.
    - **TESTS.md**: Документиране на integration теста за таблото, обяснявайки сценария, който покрива.

- **Task 3.1.2: Създаване на Dashboard Page (Frontend)**
  - [ ] Създаване на нова страница/рут `/dashboard`, защитена с `ProtectedRoute`.
  - [ ] При зареждане на страницата, извикване на `GET /dashboard` ендпойнта.
  - [ ] Създаване на UI, който показва списък с курсовете на потребителя.
  - [ ] За всеки курс трябва да се показва името му, изображение и индикатор за напредък.
  - [ ] Добавяне на секции за: Recent Activity, Progress Overview, Quick Actions
  - [ ] **Component Test**: Dashboard layout и component тестове
  - [ ] **Loading State Test**: Loading и error state тестове
  - [ ] **Responsive Test**: Mobile/desktop dashboard layout тестове
  - [ ] **E2E Test**: Добавяне на тест, който проверява дали таблото се зарежда и показва основните секции.
  - [ ] **Manual Smoke Test**:
    1. Login and navigate to `/dashboard`
    2. Dashboard loads with enrolled courses
    3. Progress bars show correct percentages
    4. Recent activity section populated
    5. Quick action buttons functional
    6. **Очакван резултат**:
       - ✅ Dashboard visually appealing и functional
       - ✅ All sections render properly
       - ✅ Responsive design works
  - **Документация:**
    - **README.md**: Описание на `DashboardPage` и компонентите, които използва.
    - **TESTS.md**: Документиране на E2E теста за страницата на таблото.

- **Task 3.1.3: Интеграция на Dashboard с API (Frontend)**
  - [ ] Свързване на `DashboardPage` с API клиента за извличане и показване на реални данни.
  - [ ] Обработка на loading states и errors gracefully
  - [ ] Real-time progress updates при завършване на lessons
  - [ ] **Integration Test**: Добавяне на тест, който проверява дали данните за потребителя и курсовете се извличат и показват правилно.
  - [ ] **Error Handling Test**: Network error handling тестове
  - [ ] **Data Sync Test**: Data consistency между dashboard и course pages
  - [ ] **Manual Smoke Test**:
    1. Dashboard shows real enrolled course data
    2. Complete a lesson → dashboard progress updates
    3. Simulate network error → graceful error handling
    4. **Очакван резултат**:
       - ✅ Real data integration seamless
       - ✅ Live updates work properly
       - ✅ Error states handled gracefully
  - **Документация:**
    - **README.md**: Описание на интеграцията на таблото с API.
    - **TESTS.md**: Документиране на integration теста за интеграцията на таблото.

---

### Story 3.2: Lesson Progress Tracking

_As a logged-in user, I want to be able to mark lessons as complete, so that I can track my learning progress accurately._

#### Задачи (Tasks):

- **Task 3.2.1: Имплементиране на Progress Endpoint (Backend)**
  - [ ] Създаване на `POST /progress/topics/:id/complete` ендпойнт, защитен с `JwtAuthGuard`.
  - [ ] Имплементиране на логика в `ProgressService`, която записва в таблицата `UserProgress`, че дадена лекция е завършена от потребителя.
  - [ ] Логиката трябва да преизчислява и обновява общия напредък в `UserCourseProgress` след всяка завършена лекция.
  - [ ] Добавяне на `GET /progress/topics/:id` за проверка на progress status
  - [ ] Добавяне на validation че user е enrolled в курса преди да може да mark lessons като complete
  - [ ] Добавяне на @Api... декоратори за Swagger документация.
  - [ ] **Integration Test**: Добавяне на тест, който проверява дали напредъкът се записва и преизчислява коректно.
  - [ ] **Business Logic Test**: Course enrollment validation тестове
  - [ ] **Progress Calculation Test**: Accurate progress percentage тестове
  - [ ] **Concurrency Test**: Multiple users marking progress simultaneously
  - [ ] **Manual Smoke Test**:
    1. Login and enroll in course
    2. `curl -H "Authorization: Bearer <token>" -X POST http://localhost:3001/progress/topics/1/complete` → 200 OK
    3. `curl -H "Authorization: Bearer <token>" http://localhost:3001/progress/topics/1` → completed: true
    4. Check course progress → percentage increased
    5. Try to complete topic from non-enrolled course → 403 Forbidden
    6. **Очакван резултат**:
       - ✅ Lesson completion tracking accurate
       - ✅ Course progress calculations correct
       - ✅ Enrollment validation enforced
  - **Документация:**
    - **README.md**: Документиране на progress tracking endpoints.
    - **TESTS.md**: Документиране на integration теста за маркиране на лекция като завършена.

- **Task 3.2.2: Визуализация на прогреса (Frontend)**
  - [ ] Създаване на компонент `<ProgressBar>` в `packages/ui-components`.
  - [ ] Интегриране на `<ProgressBar>` в картата на всеки курс на таблото.
  - [ ] Добавяне на progress indicators в topic/lesson pages
  - [ ] Visual feedback при completion (animations, checkmarks)
  - [ ] **Component Test**: Добавяне на тестове за компонентите, които визуализират прогреса.
  - [ ] **Visual Test**: Progress bar styling и animation тестове
  - [ ] **Accessibility Test**: Progress visualization accessibility
  - [ ] **Manual Smoke Test**:
    1. Dashboard shows progress bars for each enrolled course
    2. Progress bars visually accurate (color, percentage)
    3. Lesson pages show completion status
    4. Progress updates smoothly with animations
    5. **Очакван резултат**:
       - ✅ Progress visualization clear и accurate
       - ✅ Visual feedback engaging
       - ✅ Accessible to screen readers
  - **Документация:**
    - **README.md**: Описание на компонента `<ProgressBar>`.
    - **TESTS.md**: Документиране на component теста за `<ProgressBar>`.

- **Task 3.2.3: Интеграция на бутон за завършване (Frontend)**
  - [ ] На страницата на лекцията (`TopicPage`) добавяне на бутон "Маркирай като завършена".
  - [ ] При натискане на бутона, извикване на `POST /progress/topics/:id/complete`.
  - [ ] Optimistic UI updates - immediate visual feedback
  - [ ] Rollback mechanism при API errors
  - [ ] **Integration Test**: Добавяне на тест, който симулира завършване на лекция и проверява дали UI-ът се обновява.
  - [ ] **Error Handling Test**: Network error rollback тестове
  - [ ] **State Management Test**: Progress state synchronization тестове
  - [ ] **Manual Smoke Test**:
    1. Navigate to lesson page as enrolled user
    2. "Mark Complete" button visible и functional
    3. Click button → immediate visual feedback
    4. Button changes to "Completed" state
    5. Navigate back to dashboard → progress updated
    6. Refresh page → completion status persisted
    7. **Очакван резултат**:
       - ✅ Lesson completion seamless UX
       - ✅ State updates immediate и persistent
       - ✅ Error handling graceful
  - **Документация:**
    - **README.md**: Описание на логиката за завършване на лекция.
    - **TESTS.md**: Документиране на integration теста за процеса по завършване на лекция.

---

## Epic 4: Testing System & Assessment

### Story 4.1: View Test & Questions

_As a user, I want to be able to view the questions of a test, so that I can prepare to answer them._

#### Задачи (Tasks):

- **Task 4.1.1: Създаване на Test Endpoints (Backend)**
  - [ ] Създаване на `TestsModule` и `QuestionsModule` в `apps/api`.
  - [ ] Имплементиране на `GET /tests/:id` ендпойнт, който връща информация за теста и списък с въпросите към него.
  - [ ] **Важно**: Отговорът НЕ трябва да съдържа информация за верния отговор на въпросите.
  - [ ] Добавяне на `GET /topics/:id/test` за достъп до теста за дадена лекция
  - [ ] Валидация че user е enrolled в курса за да достъпи теста
  - [ ] Добавяне на @Api... декоратори за Swagger документация.
  - [ ] **Integration Test**: Добавяне на тест, който проверява дали ендпойнтът връща въпроси без верните им отговори.
  - [ ] **Security Test**: Answer leakage prevention тестове
  - [ ] **Authorization Test**: Test access permission тестове
  - [ ] **Manual Smoke Test**:
    1. Login and enroll in course with test
    2. `curl -H "Authorization: Bearer <token>" http://localhost:3001/tests/1` → 200 OK
    3. Response includes questions but NO correct answers
    4. Try access without enrollment → 403 Forbidden
    5. **Очакван резултат**:
       - ✅ Test questions available to enrolled users
       - ✅ No answer data leaked
       - ✅ Access control enforced
  - **Документация:**
    - **README.md**: Документиране на test viewing endpoints.
    - **TESTS.md**: Документиране на integration теста за извличане на въпроси за тест.

- **Task 4.1.2: Създаване на Test Page (Frontend)**
  - [ ] Създаване на нова страница/рут `/tests/:id`, защитена с `ProtectedRoute`.
  - [ ] Показване на името и описанието на теста, както и списък с въпроси.
  - [ ] Interactive question interface - radio buttons, checkboxes based on question type
  - [ ] Progress indicator за test completion
  - [ ] Timer display (ако тестът има time limit)
  - [ ] **Component Test**: Добавяне на тестове за компонентите за въпроси и отговори.
  - [ ] **Interaction Test**: Question selection и form validation тестове
  - [ ] **Accessibility Test**: Test interface accessibility compliance
  - [ ] **Manual Smoke Test**:
    1. Navigate to `/tests/1` as enrolled user
    2. Test interface loads with questions
    3. Can select answers for each question
    4. Progress indicator updates
    5. Submit button becomes enabled when all answered
    6. **Очакван резултат**:
       - ✅ Test interface intuitive и functional
       - ✅ All question types supported
       - ✅ Accessibility compliant
  - **Документация:**
    - **README.md**: Описание на `TestPage` и нейната структура.
    - **TESTS.md**: Документиране на component теста за страницата за тест.

---

### Story 4.2: Submit Test & View Results

_As a user, I want to submit my answers and see my results, so that I can assess my knowledge._

#### Задачи (Tasks):

- **Task 4.2.1: Имплементиране на Test Submission Endpoint (Backend)**
  - [ ] Създаване на `POST /tests/:id/submit` ендпойнт, защитен с `JwtAuthGuard`.
  - [ ] Имплементиране на логика за оценяване на теста и записване на резултата.
  - [ ] Съхранение на test attempts с timestamp, score, и индивидуални отговори
  - [ ] Respect за max attempts limit per user per test
  - [ ] Връщане на detailed results веднага след submission
  - [ ] Добавяне на @Api... декоратори за Swagger документация.
  - [ ] **Integration Test**: Добавяне на тест, който изпраща отговори и проверява дали резултатът се изчислява и записва правилно.
  - [ ] **Scoring Test**: Accurate score calculation тестове
  - [ ] **Attempt Limit Test**: Max attempts enforcement тестове
  - [ ] **Data Integrity Test**: Test attempt data validation
  - [ ] **Manual Smoke Test**:
    1. Complete test with known answers
    2. `curl -H "Authorization: Bearer <token>" -X POST http://localhost:3001/tests/1/submit -d '{"answers":[{"questionId":"q1","selectedOptions":["option1"]}]}' -H "Content-Type: application/json"` → 200 OK
    3. Response includes score, passed/failed status
    4. Attempt max attempts → 429 Too Many Requests
    5. **Очакван резултат**:
       - ✅ Test scoring accurate
       - ✅ Results available immediately
       - ✅ Attempt limits enforced
  - **Документация:**
    - **README.md**: Документиране на test submission endpoint.
    - **TESTS.md**: Документиране на integration теста за подаване на тест.

- **Task 4.2.2: Имплементиране на Test Submission (Frontend)**
  - [ ] На страницата на теста (`/tests/:id`) добавяне на бутон "Предай теста".
  - [ ] При натискане на бутона, изпращане на отговорите към `POST /tests/:id/submit`.
  - [ ] Validation че всички въпроси са отговорени преди submission
  - [ ] Loading state по време на submission
  - [ ] Redirect към results page след успешно submission
  - [ ] **E2E Test**: Добавяне на тест, който симулира попълване и предаване на цял тест.
  - [ ] **Validation Test**: Form validation преди submission
  - [ ] **Error Handling Test**: Submission error handling тестове
  - [ ] **Manual Smoke Test**:
    1. Complete test form by selecting answers
    2. Click "Submit Test" → loading state shown
    3. Successful submission → redirected to results
    4. Try submit incomplete test → validation errors
    5. **Очакван резултат**:
       - ✅ Test submission smooth UX
       - ✅ Validation prevents incomplete submissions
       - ✅ Loading states clear
  - **Документация:**
    - **README.md**: Описание на логиката за предаване на тест.
    - **TESTS.md**: Документиране на E2E теста за процеса по предаване на тест.

- **Task 4.2.3: Имплементиране на страница за резултати (Backend & Frontend)**
  - [ ] Създаване на `GET /tests/results/:attemptId` ендпойнт, който връща резултатите от конкретен опит.
  - [ ] Включване на detailed breakdown: correct/incorrect per question, explanations
  - [ ] Pass/fail determination based on passing percentage
  - [ ] Suggestions за improvement areas
  - [ ] Добавяне на @Api... декоратори за Swagger документация.
  - [ ] **Integration Test**: Добавяне на тест, който проверява дали ендпойнтът връща правилните резултати за даден потребител и тест.
  - [ ] **Privacy Test**: User isolation за test results
  - [ ] **Data Accuracy Test**: Results accuracy verification
  - [ ] Създаване на страница `/tests/results/:attemptId`, която показва резултатите.
  - [ ] **Component Test**: Добавяне на тестове за компонента, който показва резултатите от теста.
  - [ ] **Results Display Test**: Comprehensive results presentation тестове
  - [ ] Интеграция на страницата с API ендпойнта.
  - [ ] **Integration Test**: Добавяне на тест, който проверява дали UI-ът коректно показва данните, получени от API-то.
  - [ ] **Manual Smoke Test**:
    1. Complete и submit test → redirected to results page
    2. Results page shows: score, pass/fail, correct/incorrect breakdown
    3. Each question shows: selected answer, correct answer, explanation
    4. "Retake Test" button visible if attempts remaining
    5. Link back to course/lesson
    6. **Очакван резултат**:
       - ✅ Results comprehensive и helpful
       - ✅ Navigation options clear
       - ✅ Retry logic functional
  - **Документация:**
    - **README.md**: Описание на страницата за резултати и endpoints.
    - **TESTS.md**: Документиране на тестовете за показване на резултати.

---

## Epic 5: Admin Panel & Content Management

### Story 5.1: Course & Category Management

_As an admin, I want to be able to create, update, and delete courses and categories, so that I can manage the educational content._

#### Задачи (Tasks):

- **Task 5.1.1: Инициализиране на Admin Frontend (apps/admin)**
  - [ ] Инициализиране на ново React приложение с Vite в `apps/admin`.
  - [ ] Конфигуриране на TypeScript, ESLint, Prettier и `react-router-dom`.
  - [ ] Setup на Mantine UI за consistent styling с main app
  - [ ] Споделяне на компоненти от `packages/ui-components`
  - [ ] Конфигуриране на API client за admin endpoints
  - [ ] **Unit Test**: Добавяне на тест за базовата конфигурация на приложението.
  - [ ] **Build Test**: Admin app build success тест
  - [ ] **Integration Test**: Shared component integration тест
  - [ ] **Manual Smoke Test**:
    1. `cd apps/admin && npm run dev` → starts on port 3002
    2. Navigate to `http://localhost:3002` → admin interface loads
    3. Basic routing works → navigation functional
    4. **Очакван резултат**:
       - ✅ Admin app builds и runs successfully
       - ✅ UI framework functional
       - ✅ Shared components work
  - **Документация:**
    - **README.md**: Добавяне на секция за `apps/admin` с инструкции за стартиране.
    - **TESTS.md**: Документиране на unit теста за конфигурацията.

- **Task 5.1.2: Имплементиране на Admin CRUD Endpoints (Backend)**
  - [ ] Имплементиране на CRUD ендпойнти за `Categories` (`/admin/categories`) и `Courses` (`/admin/courses`).
  - [ ] Всички ендпойнти трябва да са защитени с `RolesGuard('ADMIN')`.
  - [ ] Bulk operations support - bulk delete, bulk status updates
  - [ ] Rich metadata support - descriptions, images, ordering
  - [ ] Validation за business rules (no delete if courses exist, etc.)
  - [ ] Добавяне на @Api... декоратори за Swagger документация.
  - [ ] **Integration Test**: Добавяне на тестове, които проверяват CRUD операциите и защитата с `RolesGuard`.
  - [ ] **Business Logic Test**: Business rule validation тестове
  - [ ] **Bulk Operation Test**: Bulk CRUD operations тестове
  - [ ] **Security Test**: Admin-only access enforcement
  - [ ] **Manual Smoke Test**:
    1. Login as admin → get admin token
    2. `curl -H "Authorization: Bearer <admin_token>" http://localhost:3001/admin/categories` → categories list
    3. `curl -H "Authorization: Bearer <admin_token>" -X POST http://localhost:3001/admin/categories -d '{"name":"New Category","description":"Test"}' -H "Content-Type: application/json"` → 201 Created
    4. `curl -H "Authorization: Bearer <admin_token>" -X PUT http://localhost:3001/admin/categories/1 -d '{"name":"Updated"}' -H "Content-Type: application/json"` → 200 OK
    5. Try with user token → 403 Forbidden
    6. **Очакван резултат**:
       - ✅ Full CRUD functionality for admins
       - ✅ Non-admin access blocked
       - ✅ Business rules enforced
  - **Документация:**
    - **README.md**: Документиране на административните CRUD ендпойнти за курсове и категории.
    - **TESTS.md**: Документиране на integration тестовете за административните ендпойнти.

- **Task 5.1.3: Създаване на UI за управление на категории (Frontend)**
  - [ ] Създаване на страница `/admin/categories` с CRUD функционалност.
  - [ ] Data table с sorting, filtering, pagination
  - [ ] Create/Edit modal forms с validation
  - [ ] Bulk action support (select multiple, bulk delete)
  - [ ] Real-time search and filtering
  - [ ] **Component Test**: Тестване на CRUD компонентите за управление на категории.
  - [ ] **Form Test**: Category form validation тестове
  - [ ] **Table Test**: Data table functionality тестове
  - [ ] **Manual Smoke Test**:
    1. Navigate to `/admin/categories`
    2. Table loads with existing categories
    3. "Add Category" → modal opens with form
    4. Create new category → appears in table
    5. Edit category → changes saved
    6. Delete category → removed from table
    7. **Очакван резултат**:
       - ✅ Category management fully functional
       - ✅ UI responsive и intuitive
       - ✅ CRUD operations seamless
  - **Документация:**
    - **README.md**: Описание на UI компонентите за управление на категории.
    - **TESTS.md**: Документиране на component тестовете за UI за управление на категории.

- **Task 5.1.4: Създаване на UI за управление на курсове (Frontend)**
  - [ ] Създаване на страница `/admin/courses` с CRUD функционалност.
  - [ ] Course creation wizard за step-by-step setup
  - [ ] Rich course metadata editing - images, descriptions, difficulty levels
  - [ ] Course preview functionality
  - [ ] Course duplication feature
  - [ ] **Component Test**: Тестване на CRUD компонентите за управление на курсове.
  - [ ] **Wizard Test**: Course creation wizard flow тестове
  - [ ] **Media Test**: Image upload и preview тестове
  - [ ] **Manual Smoke Test**:
    1. Navigate to `/admin/courses`
    2. "Create Course" → wizard opens
    3. Complete course creation → course added
    4. Edit course metadata → changes saved
    5. Preview course → opens in new tab
    6. **Очакван резултат**:
       - ✅ Course management comprehensive
       - ✅ Wizard flow intuitive
       - ✅ Rich editing capabilities
  - **Документация:**
    - **README.md**: Описание на UI компонентите за управление на курсове.
    - **TESTS.md**: Документиране на component тестовете за UI за управление на курсове.

---

### Story 5.2: Lesson & Content Management

_As an admin, I want to be able to add, edit, and delete lessons (topics) within a course, so that I can structure the learning material._

#### Задачи (Tasks):

- **Task 5.2.1: Имплементиране на Admin Topic Endpoints (Backend)**
  - [ ] Имплементиране на CRUD ендпойнти за `Topics` (`/admin/courses/:courseId/topics`), защитени с `RolesGuard('ADMIN')`.
  - [ ] **КРИТИЧНО**: Multi-language content management endpoints
  - [ ] Topic ordering/reordering support
  - [ ] Draft/Published status management
  - [ ] Topic templates за faster content creation
  - [ ] **Integration Test**: Добавяне на тестове за CRUD операциите с лекции.
  - [ ] **Multi-language Test**: Multi-language content CRUD тестове
  - [ ] **Ordering Test**: Topic reordering functionality тестове
  - [ ] **Status Test**: Draft/publish workflow тестове
  - [ ] **Manual Smoke Test**:
    1. `curl -H "Authorization: Bearer <admin_token>" http://localhost:3001/admin/courses/1/topics` → topics list
    2. `curl -H "Authorization: Bearer <admin_token>" -X POST http://localhost:3001/admin/courses/1/topics -d '{"title":"New Topic","content":"Content","languageCode":"bg"}' -H "Content-Type: application/json"` → 201 Created
    3. Create same topic in English → multi-language support
    4. Reorder topics → order updated
    5. **Очакван резултат**:
       - ✅ Topic CRUD fully functional
       - ✅ Multi-language support working
       - ✅ Topic ordering functional
  - **Документация:**
    - **README.md**: Документиране на административните CRUD ендпойнти за лекции.
    - **TESTS.md**: Документиране на integration тестовете за управление на лекции.

- **Task 5.2.2: Създаване на UI за управление на лекции (Frontend)**
  - [ ] Създаване на страница `/admin/courses/:id`, която показва детайли за курса и таблица с неговите лекции.
  - [ ] Drag-and-drop reordering за topics
  - [ ] Language tabs за multi-language content editing
  - [ ] Inline editing за quick content updates
  - [ ] Lesson preview functionality
  - [ ] **Component Test**: Тестване на UI компонентите за управление на лекции.
  - [ ] **Drag-Drop Test**: Topic reordering interaction тестове
  - [ ] **Multi-language Test**: Language switching и content editing тестове
  - [ ] **Manual Smoke Test**:
    1. Navigate to `/admin/courses/1`
    2. Course details и topics list visible
    3. Drag topic to reorder → order updates
    4. Switch language tab → content changes
    5. Edit topic inline → saves immediately
    6. **Очакван резултат**:
       - ✅ Topic management intuitive
       - ✅ Multi-language editing seamless
       - ✅ Reordering functional
  - **Документация:**
    - **README.md**: Описание на UI за управление на лекции.
    - **TESTS.md**: Документиране на component тестовете за UI за управление на лекции.

- **Task 5.2.3: Интегриране на Rich Text Editor (Frontend)**
  - [ ] Интегриране на rich text editor (напр. Tiptap) във формата за създаване/редактиране на лекция.
  - [ ] Custom toolbar с educational content features (code blocks, math equations, images)
  - [ ] Auto-save functionality за prevent content loss
  - [ ] Content templates за common lesson structures
  - [ ] Media management integration (image uploads)
  - [ ] **Component Test**: Добавяне на тест, който проверява дали редакторът се зарежда и работи коректно.
  - [ ] **Rich Text Test**: Rich text editing functionality тестове
  - [ ] **Auto-save Test**: Content auto-save mechanism тестове
  - [ ] **Media Test**: Image upload и embedding тестове
  - [ ] **Manual Smoke Test**:
    1. Open lesson editor → rich text editor loads
    2. Use toolbar features → formatting applies
    3. Upload image → embeds in content
    4. Leave page → auto-save prompts
    5. **Очакван резултат**:
       - ✅ Rich text editing comprehensive
       - ✅ Auto-save prevents data loss
       - ✅ Media integration smooth
  - **Документация:**
    - **README.md**: Описание на избрания Rich Text Editor и неговата интеграция.
    - **TESTS.md**: Документиране на component теста за Rich Text Editor-а.

---

### Story 5.3: Test & Question Management

_As an admin, I want to create and manage tests and their questions, so that I can assess user knowledge effectively._

#### Задачи (Tasks):

- **Task 5.3.1: Имплементиране на Admin Test/Question Endpoints (Backend)**
  - [ ] Имплементиране на CRUD ендпойнти за `Tests` (`/admin/tests`) и `Questions` (`/admin/tests/:testId/questions`).
  - [ ] Всички ендпойнти трябва да са защитени с `RolesGuard('ADMIN')`.
  - [ ] Question types support: single choice, multiple choice, true/false
  - [ ] Question pools and randomization options
  - [ ] Test configuration: time limits, passing scores, attempt limits
  - [ ] Question import/export functionality
  - [ ] **Integration Test**: Добавяне на тестове за CRUD ендпойнтите за тестове и въпроси, включително проверка на RBAC.
  - [ ] **Question Types Test**: Different question type handling тестове
  - [ ] **Test Configuration Test**: Test settings validation тестове
  - [ ] **Import/Export Test**: Bulk question operations тестове
  - [ ] **Manual Smoke Test**:
    1. `curl -H "Authorization: Bearer <admin_token>" -X POST http://localhost:3001/admin/tests -d '{"topicId":"1","title":"Test 1","passingPercentage":70}' -H "Content-Type: application/json"` → 201 Created
    2. `curl -H "Authorization: Bearer <admin_token>" -X POST http://localhost:3001/admin/tests/1/questions -d '{"questionText":"What is QA?","questionType":"single","options":[{"text":"Quality Assurance","isCorrect":true}]}' -H "Content-Type: application/json"` → question created
    3. Configure test settings → settings saved
    4. Export questions → JSON/CSV export
    5. **Очакван резултат**:
       - ✅ Test/question CRUD functional
       - ✅ Question types properly handled
       - ✅ Configuration options work
  - **Документация:**
    - **README.md**: Документиране на административните CRUD ендпойнти за тестове и въпроси.
    - **TESTS.md**: Документиране на integration тестовете за управление на тестове и въпроси.

- **Task 5.3.2: Създаване на UI за управление на тестове (Frontend)**
  - [ ] Създаване на страница `/admin/tests` с CRUD функционалност за тестовете.
  - [ ] Test creation wizard с advanced configuration options
  - [ ] Test preview functionality за admin testing
  - [ ] Test analytics dashboard (attempt rates, average scores)
  - [ ] Test template library
  - [ ] **Component Test**: Тестване на CRUD компонентите за управление на тестове.
  - [ ] **Wizard Test**: Test creation wizard flow тестове
  - [ ] **Analytics Test**: Test analytics display тестове
  - [ ] **Preview Test**: Test preview functionality тестове
  - [ ] **Manual Smoke Test**:
    1. Navigate to `/admin/tests`
    2. "Create Test" → wizard opens
    3. Configure test settings → saves properly
    4. Preview test → opens in test interface
    5. View analytics → displays test statistics
    6. **Очакван резултат**:
       - ✅ Test management comprehensive
       - ✅ Wizard flow intuitive
       - ✅ Analytics insightful
  - **Документация:**
    - **README.md**: Описание на UI за управление на тестове.
    - **TESTS.md**: Документиране на component тестовете за UI за управление на тестове.

- **Task 5.3.3: Създаване на UI за управление на въпроси (Frontend)**
  - [ ] Създаване на страница `/admin/tests/:id` с CRUD функционалност за въпросите към даден тест.
  - [ ] Question builder interface с drag-and-drop
  - [ ] Question type templates (single choice, multiple choice, etc.)
  - [ ] Bulk question import from CSV/JSON
  - [ ] Question preview в real test format
  - [ ] Question bank integration за reusing questions
  - [ ] **E2E Test**: Добавяне на тест, който симулира целия процес: създаване на тест, добавяне на въпроси, редактиране и изтриване.
  - [ ] **Question Builder Test**: Question creation interface тестове
  - [ ] **Import Test**: Bulk question import тестове
  - [ ] **Question Bank Test**: Question reuse functionality тестове
  - [ ] **Manual Smoke Test**:
    1. Navigate to `/admin/tests/1`
    2. "Add Question" → question builder opens
    3. Create different question types → all save properly
    4. Import questions from CSV → bulk import works
    5. Preview questions → display correctly
    6. Reorder questions → order updates
    7. **Очакван резултат**:
       - ✅ Question management fully featured
       - ✅ Question builder intuitive
       - ✅ Bulk operations efficient
  - **Документация:**
    - **README.md**: Описание на UI за управление на въпроси.
    - **TESTS.md**: Документиране на E2E теста за цялостния работен процес по управление на въпроси.

---

### Story 5.4: User Management & System Administration

_As an admin, I want to manage users and system settings, so that I can maintain the platform effectively._

#### Задачи (Tasks):

- **Task 5.4.1: User Management API Endpoints (Backend)**
  - [ ] Създаване на `GET /admin/users` endpoint със пагинация и филтри
  - [ ] Създаване на `PUT /admin/users/:id` endpoint за user profile updates
  - [ ] Създаване на `PUT /admin/users/:id/role` endpoint за role changes
  - [ ] Създаване на `PUT /admin/users/:id/status` endpoint за activate/deactivate
  - [ ] User activity logs и audit trail
  - [ ] Bulk user operations (bulk email, bulk role changes)
  - [ ] Всички endpoints защитени със `@Roles('ADMIN')`
  - [ ] **Integration Test**: Admin user management CRUD operations
  - [ ] **Security Test**: Non-admin access denial тестове
  - [ ] **Audit Test**: User activity logging тестове
  - [ ] **Bulk Operations Test**: Bulk user management тестове
  - [ ] **Manual Smoke Test**:
    1. Login as admin
    2. `curl -H "Authorization: Bearer <admin_token>" http://localhost:3001/admin/users` → paginated user list
    3. `curl -H "Authorization: Bearer <admin_token>" -X PUT http://localhost:3001/admin/users/1/role -d '{"role":"admin"}' -H "Content-Type: application/json"` → role updated
    4. `curl -H "Authorization: Bearer <admin_token>" -X PUT http://localhost:3001/admin/users/1/status -d '{"isActive":false}' -H "Content-Type: application/json"` → user deactivated
    5. Try with user token → 403 Forbidden
    6. **Очакван резултат**:
       - ✅ Full user management functionality for admins
       - ✅ Non-admin access blocked
       - ✅ Audit trail maintained
  - **Документация:**
    - **README.md**: Документиране на admin user management endpoints
    - **TESTS.md**: Документиране на admin user management тестовете

- **Task 5.4.2: System Settings Management (Backend)**
  - [ ] Създаване на `SystemSettings` entity за конфигурации
  - [ ] Създаване на `GET /admin/settings` endpoint
  - [ ] Създаване на `PUT /admin/settings` endpoint
  - [ ] Settings за email daily limits, registration enabled/disabled, maintenance mode
  - [ ] Site-wide announcements management
  - [ ] Feature flags за gradual feature rollout
  - [ ] **Integration Test**: System settings CRUD tests
  - [ ] **Validation Test**: Settings validation тестове
  - [ ] **Feature Flag Test**: Feature flag functionality тестове
  - [ ] **Manual Smoke Test**:
    1. `curl -H "Authorization: Bearer <admin_token>" http://localhost:3001/admin/settings` → current settings
    2. `curl -H "Authorization: Bearer <admin_token>" -X PUT http://localhost:3001/admin/settings -d '{"emailDailyLimit":50}' -H "Content-Type: application/json"` → setting updated
    3. `curl -H "Authorization: Bearer <admin_token>" http://localhost:3001/admin/settings` → verify updated value
    4. **Očакван резултат**:
       - ✅ System settings management functional
       - ✅ Validation prevents invalid settings
       - ✅ Changes take effect immediately
  - **Документация:**
    - **README.md**: Документиране на system settings functionality
    - **TESTS.md**: Документиране на system settings тестовете

- **Task 5.4.3: Admin Dashboard Statistics (Backend)**
  - [ ] Създаване на `GET /admin/dashboard/stats` endpoint
  - [ ] Statistics за: total users, active users, total courses, enrollment stats
  - [ ] Performance metrics: avg response times, error rates
  - [ ] Email usage statistics (daily count, remaining quota)
  - [ ] Recent activity feed (new registrations, course completions)
  - [ ] **Integration Test**: Dashboard stats endpoint тест
  - [ ] **Performance Test**: Stats calculation performance (<500ms)
  - [ ] **Data Accuracy Test**: Statistics accuracy verification
  - [ ] **Manual Smoke Test**:
    1. Login as admin
    2. `curl -H "Authorization: Bearer <admin_token>" http://localhost:3001/admin/dashboard/stats` → comprehensive stats object
    3. Verify all expected metrics present: userStats, courseStats, systemHealth
    4. Check performance → response under 500ms
    5. **Очакван резултат**:
       - ✅ Dashboard statistics comprehensive
       - ✅ Performance meets requirements
       - ✅ Data accuracy verified
  - **Документация:**
    - **README.md**: Документиране на admin dashboard stats
    - **TESTS.md**: Документиране на dashboard stats тестовете

- **Task 5.4.4: User Management UI (Frontend - Admin App)**
  - [ ] Създаване на `/admin/users` страница с user table
  - [ ] Pagination, sorting, filtering functionality
  - [ ] Role change modal/form
  - [ ] User activation/deactivation toggles
  - [ ] User activity timeline за individual users
  - [ ] Bulk user operations interface
  - [ ] **Component Test**: User management UI components
  - [ ] **Table Test**: User table functionality тестове
  - [ ] **Bulk Operations Test**: Bulk user actions тестове
  - [ ] **E2E Test**: Complete user management workflow
  - [ ] **Manual Smoke Test**:
    1. Navigate to `/admin/users`
    2. User table loads with pagination
    3. Search for specific user → filtered results
    4. Change user role → success confirmation
    5. Toggle user status → immediate UI update
    6. Select multiple users → bulk actions available
    7. **Очакван резултат**:
       - ✅ User management interface comprehensive
       - ✅ All operations work seamlessly
       - ✅ Bulk operations efficient
  - **Документация:**
    - **README.md**: Описание на user management UI
    - **TESTS.md**: Документиране на user management UI тестовете

---

## Epic 6: Performance & Production Readiness

### Story 6.1: Performance Optimization

_As a user, I want the application to load fast and respond quickly, so that I have a smooth learning experience._

#### Задачи (Tasks):

- **Task 6.1.1: Frontend Bundle Optimization (Frontend)**
  - [ ] Конфигуриране на Vite за production optimizations
  - [ ] Code splitting по routes и lazy loading
  - [ ] Bundle analysis и optimization за <500KB target (според NFR1)
  - [ ] Image optimization и lazy loading
  - [ ] Service Worker за caching strategy
  - [ ] **Performance Test**: Bundle size verification (<500KB gzipped)
  - [ ] **Lighthouse Test**: Performance score >90
  - [ ] **Loading Test**: Page load time measurements
  - [ ] **Cache Test**: Service Worker caching effectiveness
  - [ ] **Manual Smoke Test**:
    1. `npm run build` → successful build
    2. Check bundle sizes → all chunks <500KB
    3. `npm run preview` → fast loading times
    4. Run Lighthouse audit → performance score >90
    5. Test offline functionality → cached content accessible
    6. **Очакван резултат**:
       - ✅ Bundle size under target
       - ✅ Lighthouse performance >90
       - ✅ Fast loading times
       - ✅ Caching strategy effective
  - **Документация:**
    - **README.md**: Performance optimization strategies
    - **TESTS.md**: Performance testing procedures

- **Task 6.1.2: Backend Performance Optimization (Backend)**
  - [ ] Database query optimization и indexing strategy
  - [ ] API response caching за static content
  - [ ] Connection pooling optimization
  - [ ] Response time monitoring (<200ms target според NFR1)
  - [ ] Database query logging и analysis
  - [ ] **Performance Test**: Load testing със 100 concurrent users
  - [ ] **Database Test**: Query performance verification
  - [ ] **Cache Test**: API response caching effectiveness
  - [ ] **Monitoring Test**: Response time tracking setup
  - [ ] **Manual Smoke Test**:
    1. Run load test script → all responses <200ms
    2. Check database query performance → optimized queries
    3. Monitor memory usage → stable under load
    4. Test cache hit rates → high cache effectiveness
    5. **Очакван резултат**:
       - ✅ API responses under 200ms
       - ✅ Database queries optimized
       - ✅ Memory usage stable
       - ✅ Caching effective
  - **Документация:**
    - **README.md**: Backend performance optimizations
    - **TESTS.md**: Performance testing methodology

### Story 6.2: Production Deployment

_As a DevOps engineer, I want automated deployment and monitoring, so that the platform runs reliably in production._

#### Задачи (Tasks):

- **Task 6.2.1: Docker Production Configuration**
  - [ ] Създаване на production Dockerfiles за всички services
  - [ ] Docker Compose production configuration
  - [ ] Multi-stage builds за optimized images
  - [ ] Health checks за всички containers
  - [ ] Nginx reverse proxy configuration
  - [ ] SSL/TLS certificate management
  - [ ] **Integration Test**: Docker compose up/down tests
  - [ ] **Security Test**: Container security scanning
  - [ ] **Health Check Test**: Container health monitoring
  - [ ] **Manual Smoke Test**:
    1. `docker-compose -f docker-compose.prod.yml build` → successful builds
    2. `docker-compose -f docker-compose.prod.yml up -d` → all services running
    3. Health check endpoints → all healthy
    4. Test SSL certificates → HTTPS working
    5. Full application functionality test → working end-to-end
    6. **Очакван резултат**:
       - ✅ Production deployment successful
       - ✅ All health checks passing
       - ✅ SSL/HTTPS functional
       - ✅ Full functionality maintained
  - **Документация:**
    - **README.md**: Production deployment instructions
    - **TESTS.md**: Docker deployment testing

- **Task 6.2.2: Automated Backup System**
  - [ ] PostgreSQL backup scripts (според architecture)
  - [ ] Automated daily backup с external storage (rclone)
  - [ ] Backup encryption със gpg
  - [ ] Backup verification и restoration testing
  - [ ] Backup retention policy (daily for 30 days, weekly for 3 months)
  - [ ] **Integration Test**: Backup creation и restoration тестове
  - [ ] **Encryption Test**: Backup encryption verification
  - [ ] **Storage Test**: External storage upload validation
  - [ ] **Manual Smoke Test**:
    1. Run backup script → successful backup file
    2. Verify backup encryption → encrypted file created
    3. Test restoration process → data restored correctly
    4. Verify external storage upload → backup stored remotely
    5. Test backup retention → old backups cleaned up
    6. **Очакван резултат**:
       - ✅ Automated backups working
       - ✅ Encryption functional
       - ✅ Restoration process verified
       - ✅ External storage reliable
  - **Документация:**
    - **README.md**: Backup and recovery procedures
    - **TESTS.md**: Backup system testing

- **Task 6.2.3: Monitoring Integration**
  - [ ] Sentry integration за error tracking (според architecture)
  - [ ] Application performance monitoring setup
  - [ ] Database performance monitoring
  - [ ] Uptime monitoring и alerting
  - [ ] Custom metrics collection (user activity, course completions)
  - [ ] **Integration Test**: Monitoring service integration тестове
  - [ ] **Alert Test**: Alert notification delivery тестове
  - [ ] **Metrics Test**: Custom metrics collection verification
  - [ ] **Manual Smoke Test**:
    1. Trigger test error → appears in Sentry
    2. Monitor API response times → metrics collected
    3. Test database monitoring → query performance tracked
    4. Simulate downtime → alerts triggered
    5. **Очакван резултат**:
       - ✅ Error tracking functional
       - ✅ Performance monitoring active
       - ✅ Alerting system working
       - ✅ Custom metrics collected
  - **Документация:**
    - **README.md**: Monitoring and alerting setup
    - **TESTS.md**: Monitoring integration testing

---

## Epic 7: Multi-language & Accessibility

### Story 7.1: Multi-language Content Management

_As an admin, I want to manage content in multiple languages, so that I can serve users in their preferred language._

#### Задачи (Tasks):

- **Task 7.1.1: Multi-language Admin UI (Frontend - Admin App)**
  - [ ] Language selector в content creation/edit forms
  - [ ] Bulk translation workflow interface
  - [ ] Content completeness indicators (bg/en/de availability)
  - [ ] Translation memory integration за consistency
  - [ ] Auto-translation suggestions (с external API)
  - [ ] **Component Test**: Multi-language content form components
  - [ ] **Workflow Test**: Bulk translation process тестове
  - [ ] **Translation Test**: Translation API integration тестове
  - [ ] **E2E Test**: Create content in multiple languages workflow
  - [ ] **Manual Smoke Test**:
    1. Create topic with Bulgarian content
    2. Add English translation → saved successfully
    3. Add German translation → saved successfully
    4. Verify content completeness indicators → all languages marked
    5. Test bulk translation workflow → multiple items translated
    6. **Очакван резултат**:
       - ✅ Multi-language editing seamless
       - ✅ Translation workflow efficient
       - ✅ Content completeness tracking accurate
  - **Документация:**
    - **README.md**: Multi-language content management workflow
    - **TESTS.md**: Multi-language UI testing procedures

- **Task 7.1.2: Language Switching (Frontend - Public App)**
  - [ ] Language selector в public interface
  - [ ] Automatic language detection от browser preference
  - [ ] URL-based language routing (/bg/courses, /en/courses)
  - [ ] Language preference persistence
  - [ ] Fallback mechanism за missing translations
  - [ ] **Component Test**: Language switching UI components
  - [ ] **Routing Test**: Language-based routing тестове
  - [ ] **Persistence Test**: Language preference storage тестове
  - [ ] **Fallback Test**: Missing translation handling тестове
  - [ ] **Manual Smoke Test**:
    1. Visit site → detects browser language
    2. Switch language → content updates immediately
    3. Navigate to different page → language persisted
    4. View content missing in selected language → fallback works
    5. **Очакван резултат**:
       - ✅ Language switching smooth
       - ✅ Language preference maintained
       - ✅ Fallback mechanism functional
  - **Документация:**
    - **README.md**: Language switching functionality
    - **TESTS.md**: Language switching testing procedures

### Story 7.2: Accessibility Compliance

_As a user with disabilities, I want the application to be accessible, so that I can use all features effectively._

#### Задачи (Tasks):

- **Task 7.2.1: Accessibility Implementation (Frontend)**
  - [ ] ARIA labels и semantic HTML structure
  - [ ] Keyboard navigation support
  - [ ] Color contrast compliance (4.5:1 ratio)
  - [ ] Focus management за modals и forms
  - [ ] Screen reader optimizations
  - [ ] High contrast mode support
  - [ ] **Accessibility Test**: axe-core automated testing
  - [ ] **Keyboard Test**: Keyboard-only navigation тестове
  - [ ] **Screen Reader Test**: Screen reader compatibility тестове
  - [ ] **Contrast Test**: Color contrast ratio verification
  - [ ] **Manual Accessibility Test**: Complete accessibility audit
  - [ ] **Manual Smoke Test**:
    1. Navigate entire app using only keyboard → all features accessible
    2. Test with screen reader → proper announcements
    3. Check color contrast ratios → all pass WCAG AA
    4. Test focus management → logical tab order
    5. Test high contrast mode → content remains usable
    6. **Очакван резултат**:
       - ✅ Full keyboard accessibility
       - ✅ Screen reader compatibility
       - ✅ WCAG AA compliance
       - ✅ Logical focus management
  - **Документация:**
    - **README.md**: Accessibility features и compliance
    - **TESTS.md**: Accessibility testing procedures

- **Task 7.2.2: Accessibility Testing Integration**
  - [ ] Автоматизирани accessibility tests в CI pipeline
  - [ ] Accessibility regression testing
  - [ ] Accessibility reporting dashboard
  - [ ] Developer accessibility guidelines
  - [ ] **CI Test**: Automated accessibility testing in pipeline
  - [ ] **Regression Test**: Accessibility regression prevention
  - [ ] **Documentation Test**: Accessibility guideline compliance
  - [ ] **Manual Smoke Test**:
    1. Run accessibility tests in CI → all pass
    2. Check accessibility report → no violations
    3. Review developer guidelines → comprehensive coverage
    4. **Очакван резултат**:
       - ✅ Automated accessibility testing active
       - ✅ Regression prevention working
       - ✅ Guidelines comprehensive
  - **Документация:**
    - **README.md**: Accessibility testing process
    - **TESTS.md**: Automated accessibility testing setup

---

## Epic 8: Advanced Features & Optimization

### Story 8.1: Search & Discovery Enhancement

_As a user, I want advanced search capabilities, so that I can quickly find relevant learning content._

#### Задачи (Tasks):

- **Task 8.1.1: Advanced Search Implementation (Backend)**
  - [ ] Enhanced PostgreSQL FTS с weighted search results
  - [ ] Search filters: difficulty level, duration, category
  - [ ] Search suggestions и autocomplete
  - [ ] Search analytics и popular queries tracking
  - [ ] **Integration Test**: Advanced search functionality тестове
  - [ ] **Performance Test**: Search performance под натоварване
  - [ ] **Relevance Test**: Search result relevance verification
  - [ ] **Manual Smoke Test**:
    1. Search with filters → filtered results returned
    2. Test autocomplete → suggestions appear
    3. Search analytics → popular queries tracked
    4. **Очакван резултат**:
       - ✅ Advanced search functional
       - ✅ Search results relevant
       - ✅ Performance acceptable
  - **Документация:**
    - **README.md**: Advanced search capabilities
    - **TESTS.md**: Search functionality testing

- **Task 8.1.2: Search UI Enhancement (Frontend)**
  - [ ] Advanced search interface с filters
  - [ ] Search result highlighting
  - [ ] Search history и saved searches
  - [ ] **Component Test**: Search UI component тестове
  - [ ] **UX Test**: Search user experience тестове
  - [ ] **Manual Smoke Test**:
    1. Use advanced search → intuitive interface
    2. Apply filters → results update immediately
    3. Save searches → accessible later
    4. **Очакван резултат**:
       - ✅ Search interface user-friendly
       - ✅ Advanced features accessible
  - **Документация:**
    - **README.md**: Search interface features
    - **TESTS.md**: Search UI testing

### Story 8.2: Analytics & Reporting

_As an admin, I want detailed analytics and reporting, so that I can make data-driven decisions about content and platform improvements._

#### Задачи (Tasks):

- **Task 8.2.1: Analytics Data Collection (Backend)**
  - [ ] User behavior tracking (page views, time spent, clicks)
  - [ ] Learning analytics (completion rates, test scores, progress patterns)
  - [ ] Content performance metrics
  - [ ] **Integration Test**: Analytics data collection тестове
  - [ ] **Privacy Test**: GDPR compliance за analytics
  - [ ] **Manual Smoke Test**:
    1. User activity → tracked properly
    2. Learning progress → analytics collected
    3. Privacy controls → GDPR compliant
    4. **Очакван резултат**:
       - ✅ Analytics comprehensive
       - ✅ Privacy compliant
  - **Документация:**
    - **README.md**: Analytics and privacy policies
    - **TESTS.md**: Analytics collection testing

- **Task 8.2.2: Admin Analytics Dashboard (Frontend)**
  - [ ] Interactive analytics dashboard
  - [ ] Custom report generation
  - [ ] Data export functionality
  - [ ] **Component Test**: Analytics dashboard components
  - [ ] **Data Test**: Report generation accuracy
  - [ ] **Manual Smoke Test**:
    1. Analytics dashboard → comprehensive insights
    2. Generate custom reports → accurate data
    3. Export data → proper formats
    4. **Очакван резултат**:
       - ✅ Dashboard informative
       - ✅ Reports accurate
  - **Документация:**
    - **README.md**: Analytics dashboard features
    - **TESTS.md**: Analytics dashboard testing

---

## Final Integration & Deployment

### Story F.1: End-to-End System Integration

_As a project stakeholder, I want all components working together seamlessly, so that the platform delivers a cohesive user experience._

#### Задачи (Tasks):

- **Task F.1.1: Complete System Integration Test**
  - [ ] End-to-end user journey testing
  - [ ] Cross-browser compatibility testing
  - [ ] Mobile responsiveness verification
  - [ ] Performance testing under realistic load
  - [ ] **E2E Test**: Complete user workflows
  - [ ] **Performance Test**: System performance под production load
  - [ ] **Compatibility Test**: Browser и device compatibility
  - [ ] **Manual Smoke Test**:
    1. Complete user registration → course enrollment → lesson completion → test taking workflow
    2. Admin content creation → publishing → user consumption workflow
    3. Multi-language content creation → switching → consumption workflow
    4. **Очакван резултат**:
       - ✅ All workflows seamless
       - ✅ Performance meets requirements
       - ✅ Cross-platform compatibility
  - **Документация:**
    - **README.md**: System integration overview
    - **TESTS.md**: Complete testing strategy

- **Task F.1.2: Production Deployment Validation**
  - [ ] Production environment setup verification
  - [ ] Security penetration testing
  - [ ] Backup and disaster recovery testing
  - [ ] Monitoring and alerting validation
  - [ ] **Security Test**: Complete security audit
  - [ ] **Disaster Recovery Test**: Backup restoration verification
  - [ ] **Production Test**: Production environment validation
  - [ ] **Manual Smoke Test**:
    1. Deploy to production → successful deployment
    2. Test all functionality → works as expected
    3. Verify monitoring → all systems monitored
    4. Test disaster recovery → restoration works
    5. **Очакван резултат**:
       - ✅ Production deployment successful
       - ✅ Security measures effective
       - ✅ Disaster recovery functional
       - ✅ Monitoring comprehensive
  - **Документация:**
    - **README.md**: Production deployment guide
    - **TESTS.md**: Production validation procedures

---

## 📋 TASK PRIORITIZATION MATRIX

### CRITICAL PATH DEPENDENCIES

1. **Epic 1** → **Epic 2 (Stories 2.1-2.4)** → **Epic 2 (Stories 2.5-2.6)** → **Epic 3** → **Epic 4** → **Epic 5**
2. **Epic 6** може да се развива паралелно със Epic 4-5
3. **Epic 7** може да се развива паралелно със Epic 5
4. **Epic 8** се развива след Epic 5
5. **Final Integration** се извършва след всички основни епики

### RECOMMENDED DEVELOPMENT PHASES

**Phase 1 (Weeks 1-2): Foundation**

- Epic 1: Complete foundation setup
- Epic 2 Stories 2.1-2.4: Core authentication

**Phase 2 (Weeks 3-4): Core Features**

- Epic 2 Stories 2.5-2.6: Email integration & enrollment
- Epic 3: User dashboard & progress tracking

**Phase 3 (Weeks 5-6): Assessment & Admin**

- Epic 4: Testing system
- Epic 5 Stories 5.1-5.3: Core admin features

**Phase 4 (Week 7): Production Ready**

- Epic 5 Story 5.4: Advanced admin features
- Epic 6: Performance & deployment
- Epic 7: Multi-language & accessibility

**Phase 5 (Week 8): Enhancement & Launch**

- Epic 8: Advanced features
- Final Integration & deployment validation

### QUALITY GATES

- Each Epic must pass all regression tests before proceeding
- Manual smoke tests must be completed for each story
- Performance benchmarks must be met before production
- Security audit must be completed before launch
- Accessibility compliance must be verified before launch

Този обновен документ включва всички критични функции от architecture.md и предоставя пълна roadmap за изграждане на QA Обучителната Платформа.
