# Списък със Задачи (Project Backlog)

Този документ проследява разбиването на потребителските истории от `prd.md` на конкретни технически задачи.

---

## Epic 1: Foundation & Public Access

### Story 1.1: Project Setup & Infrastructure

*As a developer, I want to establish the basic project structure and development environment, so that the team can efficiently develop and deploy the application.*

#### Задачи (Tasks):

- **Task 1.1.1: Инициализиране на Monorepo структура**
  - [ ] Инициализиране на `git` репозитори.
  - [ ] Конфигуриране на `pnpm workspaces` в главния `package.json`.
  - [ ] Създаване на основната директорийна структура: `apps/web`, `apps/admin`, `apps/backend`, `packages/shared-types`, `packages/ui-components`, `packages/constants`.
  - [ ] Добавяне на `.gitignore` файл с основни правила за Node.js, OS файлове и `.env`.

- **Task 1.1.2: Конфигуриране на TypeScript**
  - [ ] Създаване на базов `tsconfig.base.json` в главната директория.
  - [ ] Създаване на индивидуални `tsconfig.json` файлове във всеки проект (`apps/*`) и пакет (`packages/*`), които наследяват базовия.
  - [ ] Активиране на `"strict": true` и други препоръчителни `compilerOptions`.

- **Task 1.1.3: Настройка на Docker среда за локална разработка**
  - [ ] Създаване на `docker-compose.yml` файл.
  - [ ] Дефиниране на `service` за PostgreSQL базата данни.
  - [ ] Създаване на `Dockerfile` за `backend` приложението.
  - [ ] Добавяне на `.env.example` файл в `apps/backend` с променливи за Docker средата.

- **Task 1.1.4: Имплементиране на управление на конфигурацията**
  - [ ] Инсталиране на `@nestjs/config` в `backend` приложението.
  - [ ] Създаване на модул за валидация на променливите на средата (напр. `DATABASE_URL`, `PORT`) при стартиране на приложението.

- **Task 1.1.5: Настройка на базов CI/CD Pipeline**
  - [ ] Създаване на директория `.github/workflows`.
  - [ ] Създаване на `ci.yml` workflow, който се задейства при `push` и `pull_request`.
  - [ ] Workflow-ът трябва да инсталира зависимости с `pnpm install` и да изпълнява `lint` и `build` команди, за да валидира целостта на проекта.

---

### Story 1.2: Core Data Models & Database Schema

*As a developer, I want to establish the core database schema and data models, so that the application has a solid data foundation.*

#### Задачи (Tasks):

- **Task 1.2.1: Дефиниране на TypeORM Entities**
  - [ ] Инсталиране на `typeorm`, `@nestjs/typeorm`, и `pg` в `backend` проекта.
  - [ ] Създаване на `User` entity (`user.entity.ts`) съгласно `architecture.md`.
  - [ ] Създаване на `Category`, `Course`, `Topic`, `Test`, `Question` entities.
  - [ ] Създаване на `UserProgress`, `UserCourseProgress`, и `SystemSetting` entities.
  - [ ] Дефиниране на всички релации (One-to-Many, Many-to-One) между entities.
  - [ ] Всички entities трябва да включват базови полета като `id` (uuid), `createdAt`, `updatedAt`.

- **Task 1.2.2: Конфигуриране на TypeORM и Миграции**
  - [ ] Конфигуриране на TypeORM връзката с базата данни в `backend` (`AppModule`), използвайки `@nestjs/config`.
  - [ ] Настройване на TypeORM CLI за генериране и изпълнение на миграции.
  - [ ] Генериране на първоначална миграция, която създава всички таблици (`npm run typeorm -- migration:generate ...`).
  - [ ] Добавяне на npm скрипт (`migration:run`) за лесно прилагане на миграциите.

- **Task 1.2.3: Настройка на Data Seeding**
  - [ ] Инсталиране на `@faker-js/faker`.
  - [ ] Създаване на структура за seeder файлове (`src/database/seeders`).
  - [ ] Имплементиране на seeder за `Category` и `User` (с `admin` роля).
  - [ ] Създаване на CLI команда в NestJS (`npm run cli -- db:seed`) за изпълнение на seeder-ите.

---

### Story 1.3: Basic API Foundation

*As a developer, I want to establish the basic NestJS API structure, so that frontend applications can communicate with the backend.*

#### Задачи (Tasks):

- **Task 1.3.1: Настройка на глобални модули и конфигурация**
  - [ ] Инсталиране на `class-validator` и `class-transformer`.
  - [ ] Конфигуриране на глобален `ValidationPipe` в `main.ts` за автоматична валидация на всички входящи DTO-та.
  - [ ] Активиране на CORS (`enableCors()`) в `main.ts`, за да се позволи комуникация с frontend приложенията.

- **Task 1.3.2: Имплементиране на Health Check Endpoint**
  - [ ] Инсталиране на `@nestjs/terminus`.
  - [ ] Създаване на `HealthModule` и `HealthController`.
  - [ ] Имплементиране на `GET /health` ендпойнт, който проверява състоянието на базата данни.

- **Task 1.3.3: Централизирана обработка на грешки и логване**
  - [ ] Инсталиране на `nestjs-pino` за структурирано логване (JSON формат).
  - [ ] Конфигуриране на `pino` в `main.ts`.
  - [ ] Създаване на глобален `ExceptionFilter`, който улавя всички грешки и връща стандартизиран JSON отговор.
  - [ ] Интегриране на Sentry SDK за докладване на грешки, както е описано в `architecture.md`.

- **Task 1.3.4: Настройка на Rate Limiting**
  - [ ] Инсталиране и конфигуриране на `nestjs-throttler`.
  - [ ] Прилагане на глобално правило за ограничаване на заявките като защита по подразбиране.
  - [ ] Подготвяне на конфигурацията за лесно добавяне на по-строги правила за специфични ендпойнтове по-късно.

---

### Story 1.4: Public Content API Endpoints

*As a guest user, I want to access course and lesson content through API endpoints, so that I can browse educational content without registration.*

#### Задачи (Tasks):

- **Task 1.4.1: Създаване на модули за съдържание**
  - [ ] Създаване на `CategoriesModule`, `CoursesModule`, и `TopicsModule` в `apps/backend`.
  - [ ] Всеки модул трябва да съдържа `Controller` и `Service` файлове.
  - [ ] Импортиране на новите модули в главния `AppModule`.

- **Task 1.4.2: Имплементиране на публични ендпойнти**
  - [ ] `GET /categories`: Имплементиране на логика в `CategoriesService` и `CategoriesController` за връщане на списък с всички категории.
  - [ ] `GET /courses`: Имплементиране на логика в `CoursesService` за връщане на курсове с пагинация и филтриране по ID на категория.
  - [ ] `GET /courses/:id`: Имплементиране на логика за връщане на един курс с всичките му лекции.
  - [ ] `GET /topics/:id`: Имплементиране на логика за връщане на съдържанието на една лекция.

- **Task 1.4.3: Дефиниране на DTO-та и API документация**
  - [ ] Създаване на Response DTO-та (Data Transfer Objects) в `packages/shared-types` за всеки публичен ендпойнт, за да се осигури консистентен формат на отговорите.
  - [ ] Инсталиране и конфигуриране на `@nestjs/swagger` в `main.ts`.
  - [ ] Добавяне на `@Api...` декоратори към контролерите и DTO-тата за генериране на OpenAPI (Swagger) документация.

---

### Story 1.5: Public Frontend Implementation

*As a guest user, I want a simple and intuitive web interface, so that I can easily browse and view courses and lessons.*

#### Задачи (Tasks):

- **Task 1.5.1: Инициализиране на React приложението (apps/web)**
  - [ ] Инициализиране на ново React приложение с Vite в `apps/web`.
  - [ ] Конфигуриране на TypeScript, ESLint и Prettier за проекта.
  - [ ] Инсталиране на `react-router-dom` за навигация.

- **Task 1.5.2: Настройка на State Management и API клиент**
  - [ ] Инсталиране на `zustand` за управление на състоянието.
  - [ ] Инсталиране на `axios` (или друг HTTP клиент) за комуникация с API-то.
  - [ ] Създаване на базов API клиент с конфигуриран `baseURL`.
  - [ ] Създаване на Zustand store за глобално състояние (напр. категории).

- **Task 1.5.3: Изграждане на основни UI компоненти и layout**
  - [ ] Създаване на основен layout компонент (`<MainLayout />`), включващ Header, Footer и място за съдържанието.
  - [ ] Създаване на базови, стилизирани компоненти в `packages/ui-components` (напр. `<Button>`, `<Card>`, `<Spinner>`).

- **Task 1.5.4: Имплементиране на публични страници**
  - [ ] Създаване на страница `HomePage`, която показва списък с всички категории и популярни курсове.
  - [ ] Създаване на страница `CoursesPage`, която показва всички курсове с възможност за филтриране по категория.
  - [ ] Създаване на страница `CourseDetailsPage`, която показва детайли за един курс и списък с лекциите му.
  - [ ] Създаване на страница `TopicPage`, която показва съдържанието на една лекция.

- **Task 1.5.5: Интеграция с API**
  - [ ] Свързване на страниците с API клиента за извличане и показване на реални данни.
  - [ ] Имплементиране на състояния за зареждане (loading) и грешки (error) на всички страници, които извличат данни.

---

## Epic 2: User Authentication & Management

### Story 2.1: User Registration

*As a new user, I want to be able to register for an account, so that I can access personalized features.*

#### Задачи (Tasks):

- **Task 2.1.1: Създаване на Authentication Module (Backend)**
  - [ ] Създаване на `AuthModule` в `apps/backend`.
  - [ ] Инсталиране на необходимите пакети: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`.
  - [ ] Създаване на `AuthService` и `AuthController`.
  - [ ] Имплементиране на логика за хеширане на пароли с `bcrypt` в `UserService` или `AuthService`.

- **Task 2.1.2: Имплементиране на Registration Endpoint (Backend)**
  - [ ] Създаване на `POST /auth/register` ендпойнт.
  - [ ] Създаване на `RegisterUserDto` в `packages/shared-types` с валидация за `email`, `password`, `firstName`, `lastName`.
  - [ ] Имплементиране на логика в `AuthService` за проверка дали потребител с такъв имейл вече съществува.
  - [ ] Създаване на нов потребител в базата данни при успешна валидация.
  - [ ] Връщане на новосъздадения потребителски обект (без паролата).

- **Task 2.1.3: Създаване на Registration Page (Frontend)**
  - [ ] Създаване на нова страница/рут `/register` в `apps/web`.
  - [ ] Създаване на компонент за регистрационна форма с полета за имейл, парола, име и фамилия.
  - [ ] Имплементиране на клиентска валидация на формата.

- **Task 2.1.4: Интеграция на формата за регистрация с API (Frontend)**
  - [ ] При изпращане на формата, извикване на `POST /auth/register` ендпойнта.
  - [ ] Обработка на успешна регистрация (напр. показване на съобщение за успех и пренасочване към страницата за вход).
  - [ ] Обработка на грешки от API-то (напр. показване на съобщение "Потребител с този имейл вече съществува").

---

### Story 2.2: User Login

*As a registered user, I want to be able to log in to my account, so that I can access my personalized content and features.*

#### Задачи (Tasks):

- **Task 2.2.1: Имплементиране на JWT Стратегия (Backend)**
  - [ ] Конфигуриране на `JwtModule` в `AuthModule` със секретен ключ и време на валидност (`expiresIn`), заредени от `.env` файла.
  - [ ] Създаване на `JwtStrategy` (`jwt.strategy.ts`), която валидира payload-а на токена.
  - [ ] Имплементиране на `LocalStrategy` (`local.strategy.ts`) за валидиране на потребителско име и парола.

- **Task 2.2.2: Имплементиране на Login Endpoint (Backend)**
  - [ ] Създаване на `POST /auth/login` ендпойнт, защитен с `LocalAuthGuard`.
  - [ ] Създаване на `LoginUserDto` с `email` и `password`.
  - [ ] При успешна автентикация, `AuthService` трябва да генерира и върне `access_token` и `refresh_token`.

- **Task 2.2.3: Създаване на Login Page (Frontend)**
  - [ ] Създаване на нова страница/рут `/login` в `apps/web`.
  - [ ] Създаване на компонент за форма за вход с полета за имейл и парола.
  - [ ] Имплементиране на клиентска валидация.

- **Task 2.2.4: Интеграция на формата за вход с API (Frontend)**
  - [ ] При изпращане на формата, извикване на `POST /auth/login`.
  - [ ] При успешен отговор, съхраняване на `access_token` и `refresh_token` (напр. в `localStorage` или `cookie`).
  - [ ] Конфигуриране на `axios` клиента да изпраща `Authorization: Bearer <token>` хедър с всяка следваща заявка.
  - [ ] Пренасочване на потребителя към неговото табло (`/dashboard`) след успешен вход.
  - [ ] Обработка на грешки (напр. "Грешен имейл или парола").

---

### Story 2.3: Secure Session & Access Control

*As a logged-in user, I want my session to be secure and to be able to log out, so that my account is protected.*

#### Задачи (Tasks):

- **Task 2.3.1: Имплементиране на защитени маршрути (Backend)**
  - [ ] Прилагане на `JwtAuthGuard` към ендпойнти, които изискват автентикация (напр. `GET /profile`).
  - [ ] Създаване на къстъм декоратор `@GetUser()`, който извлича потребителския обект от `request`-а за лесно използване в контролерите.
  - [ ] Създаване на `GET /auth/profile` ендпойнт, който връща информация за текущо логнатия потребител.

- **Task 2.3.2: Имплементиране на Refresh Token механизъм (Backend)**
  - [ ] Създаване на `POST /auth/refresh` ендпойнт.
  - [ ] Логиката трябва да приема `refresh_token`, да го валидира и ако е валиден, да издава нов `access_token`.
  - [ ] При логин, `refresh_token` трябва да се съхранява в базата данни (хеширан) и да се свързва с потребителя, за да може да бъде оттеглен (revoked).

- **Task 2.3.3: Имплементиране на защитени маршрути (Frontend)**
  - [ ] Създаване на компонент `ProtectedRoute`, който проверява за наличието на `access_token`.
  - [ ] Ако няма токен, потребителят се пренасочва към `/login`.
  - [ ] Обновяване на рутирането, за да се използва `ProtectedRoute` за страници като `/dashboard`.

- **Task 2.3.4: Имплементиране на Logout и Token Refresh (Frontend)**
  - [ ] Създаване на `useAuth` hook, който предоставя информация за потребителя и статус на автентикация.
  - [ ] Имплементиране на бутон/линк за изход, който изчиства токените от хранилището и пренасочва към началната страница.
  - [ ] Имплементиране на логика в `axios` interceptor, която при грешка `401 Unauthorized` автоматично да се опитва да обнови токена чрез `/auth/refresh` ендпойнта.

---

### Story 2.4: Role-Based Access Control (RBAC)

*As an administrator, I want to have special permissions, so that I can manage the platform content and users.*

#### Задачи (Tasks):

- **Task 2.4.1: Имплементиране на Roles Guard (Backend)**
  - [ ] Дефиниране на `Role` enum в `packages/shared-types` (напр. `ADMIN`, `USER`).
  - [ ] Създаване на `@Roles()` декоратор, който да се използва за задаване на изискваните роли за даден ендпойнт.
  - [ ] Създаване на `RolesGuard`, който проверява дали ролята на потребителя отговаря на изискваните роли, дефинирани с `@Roles()` декоратора.
  - [ ] Прилагане на `RolesGuard` глобално или на специфични модули.

- **Task 2.4.2: Защита на административни ендпойнти (Backend)**
  - [ ] Създаване на примерен ендпойнт `GET /admin/stats`, който е защитен с `@Roles('ADMIN')`.
  - [ ] Добавяне на тестове, които проверяват дали потребител с роля `USER` получава `403 Forbidden` грешка при достъп до административни ендпойнти.

- **Task 2.4.3: Управление на достъпа в UI (Frontend)**
  - [ ] `useAuth` hook-а трябва да предоставя и ролята на текущия потребител.
  - [ ] Създаване на компонент `AdminRoute`, който защитава страници в админ панела и пренасочва потребители без `ADMIN` роля.
  - [ ] Имплементиране на условно рендиране на UI елементи (напр. бутон "Админ Панел" в хедъра се показва само на администратори).

---

## Epic 3: User Dashboard & Progress Tracking

### Story 3.1: User Dashboard

*As a logged-in user, I want to see a personalized dashboard, so that I can easily view my enrolled courses and track my progress.*

#### Задачи (Tasks):

- **Task 3.1.1: Създаване на Dashboard Endpoint (Backend)**
  - [ ] Създаване на `DashboardModule` и `DashboardController`.
  - [ ] Имплементиране на `GET /dashboard` ендпойнт, защитен с `JwtAuthGuard`.
  - [ ] `DashboardService` трябва да извлича всички курсове, в които потребителят се е записал, заедно с неговия напредък за всеки курс.

- **Task 3.1.2: Създаване на Dashboard Page (Frontend)**
  - [ ] Създаване на нова страница/рут `/dashboard`, защитена с `ProtectedRoute`.
  - [ ] При зареждане на страницата, извикване на `GET /dashboard` ендпойнта.
  - [ ] Създаване на UI, който показва списък с курсовете на потребителя.
  - [ ] За всеки курс трябва да се показва името му, изображение и индикатор за напредък (напр. progress bar).

- **Task 3.1.3: Визуализация на напредъка (Frontend)**
  - [ ] Създаване на компонент `<ProgressBar>` в `packages/ui-components`.
  - [ ] Изчисляване на процента на завършеност на базата на броя завършени лекции спрямо общия брой лекции в курса.
  - [ ] Интегриране на `<ProgressBar>` в картата на всеки курс на таблото.

---

### Story 3.2: Lesson Progress Tracking

*As a logged-in user, I want to be able to mark lessons as complete, so that I can track my learning progress accurately.*

#### Задачи (Tasks):

- **Task 3.2.1: Имплементиране на Progress Endpoint (Backend)**
  - [ ] Създаване на `POST /progress/topics/:id/complete` ендпойнт, защитен с `JwtAuthGuard`.
  - [ ] Имплементиране на логика в `ProgressService`, която записва в таблицата `UserProgress`, че дадена лекция е завършена от потребителя.
  - [ ] Логиката трябва да преизчислява и обновява общия напредък в `UserCourseProgress` след всяка завършена лекция.

- **Task 3.2.2: Имплементиране на бутон за завършване (Frontend)**
  - [ ] На страницата на лекцията (`TopicPage`) добавяне на бутон или checkbox "Маркирай като завършена".
  - [ ] Състоянието на бутона (дали е натиснат или не) трябва да се зарежда от API-то, за да отразява дали лекцията вече е завършена.

- **Task 3.2.3: Интеграция с API (Frontend)**
  - [ ] При натискане на бутона, извикване на `POST /progress/topics/:id/complete` ендпойнта.
  - [ ] След успешен отговор, състоянието на бутона се обновява.
  - [ ] Данните за напредъка в глобалния state (Zustand) трябва да се обновят, за да може промяната да се отрази веднага на таблото, без да е нужно презареждане на страницата.

---

## Epic 4: Testing System & Assessment

### Story 4.1: View Test & Questions

*As a user, I want to be able to view the questions of a test, so that I can prepare to answer them.*

#### Задачи (Tasks):

- **Task 4.1.1: Създаване на Test Endpoints (Backend)**
  - [ ] Създаване на `TestsModule` и `QuestionsModule` в `apps/backend`.
  - [ ] Имплементиране на `GET /tests/:id` ендпойнт, който връща информация за теста и списък с въпросите към него.
  - [ ] **Важно**: Отговорът НЕ трябва да съдържа информация за верния отговор на въпросите, за да се предотврати измама.

- **Task 4.1.2: Създаване на Test Page (Frontend)**
  - [ ] Създаване на нова страница/рут `/tests/:id`, защитена с `ProtectedRoute`.
  - [ ] При зареждане, извикване на `GET /tests/:id` ендпойнта.
  - [ ] Показване на името и описанието на теста.

- **Task 4.1.3: Визуализация на въпросите (Frontend)**
  - [ ] Създаване на компонент `<Question>`, който показва текста на въпроса и възможните отговори.
  - [ ] В зависимост от типа на въпроса (`question_type` от базата данни), трябва да се рендират `radio` бутони (за единичен избор) или `checkbox`-ове (за множествен избор).
  - [ ] Показване на списък с `<Question>` компоненти на страницата на теста.

---

### Story 4.2: Submit Test & View Results

*As a user, I want to submit my answers and see my results, so that I can assess my knowledge.*

#### Задачи (Tasks):

- **Task 4.2.1: Имплементиране на Test Submission Endpoint (Backend)**
  - [ ] Създаване на `POST /tests/:id/submit` ендпойнт.
  - [ ] Създаване на DTO, което да приема масив от отговорите на потребителя (напр. `{ questionId: string, answer: string[] }`).
  - [ ] Имплементиране на логика в `TestsService` за оценяване на теста: извличане на верните отговори от базата данни, сравняване с подадените и изчисляване на резултата.
  - [ ] Резултатът (процент успеваемост, преминат/непреминат) трябва да се записва в нова таблица `TestAttempt`.
  - [ ] Ендпойнтът трябва да върне детайлен резултат, включително кои отговори са верни и кои грешни.

- **Task 4.2.2: Имплементиране на Test Submission (Frontend)**
  - [ ] На страницата на теста (`/tests/:id`) добавяне на бутон "Предай теста".
  - [ ] Създаване на логика, която събира всички избрани отговори от `<Question>` компонентите.
  - [ ] При натискане на бутона, изпращане на отговорите към `POST /tests/:id/submit`.

- **Task 4.2.3: Създаване на страница за резултати (Frontend)**
  - [ ] Създаване на нова страница/рут `/tests/:id/results/:attemptId`.
  - [ ] След успешно предаване на теста, потребителят се пренасочва към тази страница.
  - [ ] Страницата трябва да показва резултата на потребителя (напр. "Успеваемост: 85%").
  - [ ] Трябва да показва отново въпросите, като ясно се индикира кои са отговорени правилно и кои грешно, и да се покаже верният отговор при грешка.

---

## Epic 5: Admin Panel & Content Management

### Story 5.1: Course & Category Management

*As an admin, I want to be able to create, update, and delete courses and categories, so that I can manage the educational content.*

#### Задачи (Tasks):

- **Task 5.1.1: Инициализиране на Admin Frontend (apps/admin)**
  - [ ] Инициализиране на ново React приложение с Vite в `apps/admin`.
  - [ ] Конфигуриране на TypeScript, ESLint, Prettier и `react-router-dom`.
  - [ ] Създаване на базов layout за административния панел (напр. със странична навигация).

- **Task 5.1.2: Имплементиране на Admin CRUD Endpoints (Backend)**
  - [ ] Създаване на `AdminModule` в `apps/backend`.
  - [ ] Имплементиране на CRUD ендпойнти за `Categories` (`/admin/categories`).
  - [ ] Имплементиране на CRUD ендпойнти за `Courses` (`/admin/courses`).
  - [ ] Всички ендпойнти в този модул трябва да са защитени с `JwtAuthGuard` и `RolesGuard('ADMIN')`.

- **Task 5.1.3: Създаване на UI за управление на категории (Frontend)**
  - [ ] Създаване на страница `/admin/categories`, която показва таблица с всички категории.
  - [ ] Имплементиране на бутони за "Създай", "Редактирай" и "Изтрий".
  - [ ] Създаване на форма (в модал или на отделна страница) за създаване/редактиране на категория.

- **Task 5.1.4: Създаване на UI за управление на курсове (Frontend)**
  - [ ] Създаване на страница `/admin/courses`, която показва таблица с всички курсове.
  - [ ] Имплементиране на бутони за "Създай", "Редактирай" и "Изтрий".
  - [ ] Създаване на форма за създаване/редактиране на курс, включително поле за качване на изображение и избор на категория.

---

### Story 5.2: Lesson & Content Management

*As an admin, I want to be able to add, edit, and delete lessons (topics) within a course, so that I can structure the learning material.*

#### Задачи (Tasks):

- **Task 5.2.1: Имплементиране на Admin Topic Endpoints (Backend)**
  - [ ] Имплементиране на CRUD ендпойнти за `Topics` (`/admin/courses/:courseId/topics`).
  - [ ] Ендпойнтите трябва да са защитени с `RolesGuard('ADMIN')`.
  - [ ] Логиката за създаване/редактиране трябва да приема HTML съдържание за полето `content`.

- **Task 5.2.2: Създаване на UI за управление на лекции (Frontend)**
  - [ ] Създаване на страница `/admin/courses/:id`, която показва детайли за курса и таблица с неговите лекции.
  - [ ] Имплементиране на бутони за "Добави лекция", "Редактирай" и "Изтрий".

- **Task 5.2.3: Интегриране на Rich Text Editor (Frontend)**
  - [ ] Избор и инсталиране на библиотека за rich text editing (напр. Tiptap, Quill.js).
  - [ ] Създаване на форма за създаване/редактиране на лекция, която използва rich text editor-а за полето `content`.
  - [ ] При запис, HTML съдържанието от редактора се изпраща към API-то.

---

### Story 5.3: Test & Question Management

*As an admin, I want to create and manage tests and their questions, so that I can assess user knowledge effectively.*

#### Задачи (Tasks):

- **Task 5.3.1: Имплементиране на Admin Test/Question Endpoints (Backend)**
  - [ ] Имплементиране на CRUD ендпойнти за `Tests` (`/admin/tests`).
  - [ ] Имплементиране на CRUD ендпойнти за `Questions` (`/admin/tests/:testId/questions`).
  - [ ] **Важно**: Ендпойнтите за създаване/редактиране на въпроси ТРЯБВА да приемат и обработват информация за верния отговор (`correct_answer`).
  - [ ] Всички ендпойнти трябва да са защитени с `RolesGuard('ADMIN')`.

- **Task 5.3.2: Създаване на UI за управление на тестове (Frontend)**
  - [ ] Създаване на страница `/admin/tests`, която показва таблица с всички тестове.
  - [ ] Имплементиране на CRUD функционалност за тестовете.

- **Task 5.3.3: Създаване на UI за управление на въпроси (Frontend)**
  - [ ] Създаване на страница `/admin/tests/:id`, която показва детайли за теста и таблица с въпросите към него.
  - [ ] Имплементиране на CRUD функционалност за въпросите.
  - [ ] Формата за създаване/редактиране на въпрос трябва да има полета за текст на въпроса, тип (единичен/множествен избор), възможни отговори и ясно обозначение кой отговор е верният.
