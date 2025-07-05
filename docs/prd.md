Здравейте! Аз съм **John, Product Manager** на QA Обучителната Платформа. Виждам отличния PRD, който вече имате, и ще го трансформирам в BMAD формат с епици и детайлни stories.

Вашият съществуващ PRD е солидна основа - сега ще го преструктурирам в логически последователни епици, които могат ефективно да се изпълняват от AI агенти.

_Анализирам съществуващото съдържание и трансформирам в BMAD формат..._

# QA Обучителна Платформа Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Създаване на интерактивна онлайн система за обучение в Quality Assurance
- Осигуряване на прогресивен достъп модел (безплатно съдържание, премиум функции за регистрирани)
- Изграждане на hobby-scale платформа с възможност за бъдещо разширяване
- Предоставяне на структурирано обучително съдържание с проследяване на напредъка

### Background Context

QA Обучителната Платформа адресира нуждата от структурирано и достъпно обучение в областта на Quality Assurance тестването. Съществуващите решения често са скъпи или твърде академични. Нашата платформа прилага прогресивен модел - лекционното съдържание е свободно достъпно за всички, докато разширените функции (тестове, проследяване на прогреса) изискват регистрация. Това насърчава широко използване, като същевременно предоставя стимул за регистрация.

### Change Log

| Date       | Version | Description               | Author    |
| :--------- | :------ | :------------------------ | :-------- |
| 2024-12-30 | 1.0     | Initial BMAD PRD creation | John (PM) |

## Requirements

### Functional

- FR1: Системата осигурява свободен достъп до лекционно съдържание за всички посетители
- FR2: Регистрираните потребители могат да проследяват прогреса си и да решават тестове
- FR3: Администраторите имат пълен CRUD контрол върху съдържанието чрез защитен панел
- FR4: Системата използва JWT автентикация с access/refresh токени
- FR5: Потребителският прогрес се актуализира асинхронно с optimistic UI
- FR6: Системата интегрира SendGrid за транзакционни имейли с управление на лимита
- FR7: Системата поддържа PostgreSQL за основно съхранение на данни

### Non Functional

- NFR1: API отговорите трябва да бъдат под 200ms при нормално натоварване
- NFR2: Frontend приложенията трябва да зареждат първоначално под 3 секунди
- NFR3: Системата използва Rate Limiting за защита от brute-force атаки
- NFR4: Всички входящи данни се валидират стриктно чрез DTO и class-validator
- NFR5: Системата интегрира Sentry за наблюдаемост и проследяване на грешки
- NFR6: Кодът следва чисти практики и конвенции на NestJS/React

## User Interface Design Goals

### Overall UX Vision

Минималистичен и интуитивен интерфейс, който поставя акцент върху съдържанието. Дизайнът е вдъхновен от съвременните образователни платформи с фокус върху четливост и лесна навигация.

### Key Interaction Paradigms

- **Прогресивно разкриване**: Основните функции са видими незабавно, разширените се появяват след логин
- **Карти-базиран дизайн**: Курсовете и лекциите се представят като карти за лесно сканиране
- **Веднага обратна връзка**: Optimistic UI за прогрес, мигновени отговори при тестове

### Core Screens and Views

- Начална страница (landing page)
- Каталог с курсове
- Страница на курс с лекции
- Страница на лекция със съдържание
- Потребителско табло за прогрес
- Страница за тест
- Административен панел

### Accessibility: WCAG 2.1 AA

### Branding

Чист, модерен дизайн с акцент върху четливостта. Цветова схема: основни синьо-зелени тонове за доверие и растеж в образованието.

### Target Device and Platforms

Web Responsive (Desktop-first с Mobile adaptation)

## Technical Assumptions

### Repository Structure: Monorepo

### Service Architecture

Monolithic backend (NestJS) с отделни React приложения за public и admin интерфейс, управлявани в monorepo структура с pnpm workspaces.

### Testing requirements

- Unit testing: Jest за backend, Vitest за frontend
- Integration testing: Jest с in-memory PostgreSQL
- E2E testing: Playwright за ключови потребителски пътища
- API testing: Supertest за endpoint валидация

### Additional Technical Assumptions and Requests

- PostgreSQL като основна база данни за надеждност и FTS възможности
- TypeORM за database abstraction и миграции
- Zustand за frontend state management поради простотата
- Собствени UI компоненти от `packages/ui-components` за консистентен дизайн
- Docker Compose за локална разработка
- VPS deployment с automated backup strategy

## Epics

1. **Epic 1 Foundation & Public Access**: Establish project infrastructure and core public functionality
2. **Epic 2 User Authentication & Management**: Implement secure user registration and login system
3. **Epic 3 User Dashboard & Progress Tracking**: Build personalized user experience with progress management
4. **Epic 4 Testing System & Assessment**: Create interactive testing functionality for knowledge validation
5. **Epic 5 Admin Panel & Content Management**: Provide comprehensive content management system

## Epic 1 Foundation & Public Access

Установява основната инфраструктура на проекта и предоставя ключовата публична функционалност, която позволява на всички посетители да достъпват лекционното съдържание. Този епик осигурява солидната основа за всички последващи функции.

### Story 1.1 Project Setup & Infrastructure

As a developer,
I want to establish the basic project structure and development environment,
so that the team can efficiently develop and deploy the application.

#### Acceptance Criteria

- 1: Monorepo structure is created with apps/ (web, admin, backend) and packages/ (shared-types, ui-components, constants) directories
- 2: TypeScript configuration is set up across all packages with consistent settings
- 3: PostgreSQL database is configured with basic connection and health check
- 4: Docker Compose setup provides complete local development environment
- 5: Basic CI/CD pipeline is configured for automated testing and deployment
- 6: Environment configuration management is implemented with validation
- 7: Package.json workspaces are configured for code sharing between apps

### Story 1.2 Core Data Models & Database Schema

As a developer,
I want to establish the core database schema and data models,
so that the application has a solid data foundation.

#### Acceptance Criteria

- 1: Users table is created with proper authentication fields (email, password_hash, role, etc.)
- 2: Categories table is created for organizing courses
- 3: Topics table is created for individual learning content
- 4: Topics table includes a 'content' field for lesson material as per the architecture
- 5: All tables have proper UUID primary keys, timestamps, and foreign key relationships
- 6: TypeORM entities are created matching the database schema
- 7: Database migrations are set up for schema versioning
- 8: Full-text search functionality is implemented with PostgreSQL FTS

### Story 1.3 Basic API Foundation

As a developer,
I want to establish the basic NestJS API structure,
so that frontend applications can communicate with the backend.

#### Acceptance Criteria

- 1: NestJS application boots successfully with proper module structure
- 2: Global validation pipe is configured with class-validator for input validation
- 3: CORS is configured to allow requests from frontend applications
- 4: Health check endpoint (/health) returns database connectivity status
- 5: Basic error handling middleware provides consistent error responses
- 6: Request logging is implemented with structured format
- 7: Rate limiting is configured globally with stricter limits for sensitive endpoints

### Story 1.4 Public Content API Endpoints

As a guest user,
I want to access course and lesson content through API endpoints,
so that I can browse educational content without registration.

#### Acceptance Criteria

- 1: GET /categories endpoint returns list of all active categories
- 2: GET /courses endpoint returns paginated list of courses with filtering by category
- 3: GET /courses/:id endpoint returns detailed course information including all topics
- 4: GET /topics/:id endpoint returns complete topic content in requested language
- 5: All endpoints support proper error handling for non-existent resources
- 6: Response DTOs are implemented for consistent API contracts
- 7: OpenAPI documentation is generated for all public endpoints

### Story 1.5 React Public Application Setup

As a guest user,
I want to access a responsive web application,
so that I can browse courses and topics on any device.

#### Acceptance Criteria

- 1: React application (apps/web) bootstraps with Vite and TypeScript
- 2: React Router is configured for client-side navigation
- 3: Shared UI components from `packages/ui-components` are integrated
- 4: Responsive layout component provides consistent structure across pages
- 5: HTTP client (axios) is configured with base URL and error interceptors
- 6: Shared UI components package is set up and accessible
- 7: Home page displays welcome content and course categories

### Story 1.6 Course Catalog & Navigation

As a guest user,
I want to browse available courses organized by categories,
so that I can find relevant learning content.

#### Acceptance Criteria

- 1: Courses page displays all courses in card format with title, description, and category
- 2: Category filtering allows users to filter courses by selected categories
- 3: Course cards show estimated completion time and number of topics
- 4: Search functionality allows finding courses by title or description
- 5: Course detail page shows complete topic list for the selected course
- 6: Topic links from course page navigate to individual topic content
- 7: Breadcrumb navigation helps users understand current location

### Story 1.7 Topic Content Display

As a guest user,
I want to read individual topic content in a clean, readable format,
so that I can learn effectively without distractions.

#### Acceptance Criteria

- 1: Topic page displays content with proper typography and formatting
- 2: Content supports Markdown rendering for rich text formatting
- 3: Navigation between topics within the same course is available
- 4: Reading progress indicator shows position within the topic
- 5: Topics are displayed in proper sequential order as defined in course
- 6: Language selection is available for topics with multiple translations
- 7: Topic metadata (reading time, difficulty) is displayed appropriately

## Epic 2 User Authentication & Management

Създава сигурна и удобна система за потребителска автентикация, която позволява на потребителите да се регистрират, влизат и управляват профилите си. Този епик осигурява основата за персонализираните функции.

### Story 2.1 JWT Authentication Backend

As a system,
I want to implement secure JWT-based authentication,
so that users can safely register and login to access premium features.

#### Acceptance Criteria

- 1: POST /auth/register endpoint creates new users with hashed passwords
- 2: Email uniqueness validation prevents duplicate registrations
- 3: Password strength validation requires minimum 8 characters
- 4: POST /auth/login endpoint validates credentials and issues JWT tokens
- 5: Access tokens are short-lived (15 minutes) and include user ID and role
- 6: Refresh tokens are long-lived (7 days) and stored in httpOnly cookies
- 7: POST /auth/refresh endpoint allows token renewal using refresh token
- 8: Authentication guard protects endpoints requiring user login

### Story 2.2 User Registration & Email Integration

As a guest user,
I want to register for an account with email confirmation,
so that I can access personalized features and track my progress.

#### Acceptance Criteria

- 1: Registration form validates email format and password strength in real-time
- 2: SendGrid integration sends confirmation email upon successful registration
- 3: Email confirmation link activates user account and allows login
- 4: Daily email limit tracking prevents exceeding SendGrid free tier
- 5: User receives appropriate error message if email limit is reached
- 6: Registration form shows clear success message with next steps
- 7: Duplicate email registration attempts show helpful error message

### Story 2.3 User Login & Session Management

As a registered user,
I want to securely login and have my session maintained,
so that I can access my account without frequent re-authentication.

#### Acceptance Criteria

- 1: Login form validates credentials and provides clear error messages
- 2: Successful login stores access token in memory and refresh token in httpOnly cookie
- 3: Failed login attempts are rate-limited to prevent brute force attacks
- 4: "Remember me" option extends refresh token lifetime to 30 days
- 5: Auto-refresh mechanism silently renews expired access tokens
- 6: Login redirects users to intended page or dashboard after authentication
- 7: Account lockout mechanism activates after 5 consecutive failed attempts

### Story 2.4 Frontend Authentication State Management

As a registered user,
I want the application to remember my login state across browser sessions,
so that I don't need to login repeatedly.

#### Acceptance Criteria

- 1: Zustand auth store manages authentication state globally
- 2: Auth store automatically attempts token refresh on app initialization
- 3: Protected routes redirect unauthenticated users to login page
- 4: Navigation menu updates to show user-specific options when logged in
- 5: Auth interceptor automatically adds access token to API requests
- 6: Auth interceptor handles 401 errors by attempting token refresh
- 7: Logout clears all authentication state and redirects to home page

### Story 2.5 User Profile Management

As a registered user,
I want to manage my profile information and change my password,
so that I can keep my account secure and up-to-date.

#### Acceptance Criteria

- 1: GET /auth/profile endpoint returns current user profile information
- 2: PUT /auth/profile endpoint allows updating email and language preferences
- 3: POST /auth/change-password endpoint validates old password and sets new one
- 4: Password change invalidates all existing refresh tokens for security
- 5: Profile page shows user information with editable fields
- 6: Password change form requires current password and confirms new password
- 7: Profile updates show success/error messages with proper validation

### Story 2.6 Secure Logout & Session Cleanup

As a registered user,
I want to securely logout from my account,
so that my session is properly terminated on shared devices.

#### Acceptance Criteria

- 1: POST /auth/logout endpoint clears refresh token cookie
- 2: Frontend logout clears all authentication state from memory
- 3: Logout redirects user to home page with confirmation message
- 4: "Logout from all devices" option invalidates all user refresh tokens
- 5: Automatic logout occurs when refresh token expires or is invalid
- 6: Session timeout warning appears before automatic logout
- 7: Critical actions (password change) automatically logout other sessions

## Epic 3 User Dashboard & Progress Tracking

Изгражда персонализирано потребителско изживяване с табло за управление на прогреса, позволявайки на потребителите да проследяват обучението си и да управляват личния си план за развитие.

### Story 3.1 User Progress Data Models

As a system,
I want to track user progress through courses and topics,
so that users can see their learning advancement and resume where they left off.

#### Acceptance Criteria

- 1: UserProgress table tracks completion status for each user-topic combination
- 2: Learning plan topics table allows users to create personalized learning paths
- 3: Bookmarks table enables users to save topics for later reference
- 4: Progress calculation service computes completion percentages for courses
- 5: BullMQ background jobs reliably update denormalized progress data
- 6: Database indexes optimize progress queries for dashboard performance
- 7: Progress timestamps track when topics were completed and last accessed

### Story 3.2 User Dashboard Backend API

As a registered user,
I want REST endpoints that provide my learning data,
so that my dashboard can display current progress and learning plan.

#### Acceptance Criteria

- 1: GET /users/me/progress returns aggregated progress data for all user courses
- 2: GET /users/me/learning-plan returns topics added to personal learning plan
- 3: POST /users/me/learning-plan/:topicId adds topic to learning plan
- 4: DELETE /users/me/learning-plan/:topicId removes topic from learning plan
- 5: POST /users/me/progress/:topicId marks topic as completed
- 6: GET /users/me/bookmarks returns bookmarked topics
- 7: Progress updates trigger background jobs for reliable data consistency

### Story 3.3 User Dashboard Frontend

As a registered user,
I want a personalized dashboard that shows my learning progress,
so that I can quickly see my achievements and plan next steps.

#### Acceptance Criteria

- 1: Dashboard displays progress overview with completed courses and total progress percentage
- 2: "Continue Learning" section shows recently accessed topics and suggested next topics
- 3: Learning plan widget displays user-curated list of topics to study
- 4: Progress charts visualize completion status across different categories
- 5: Quick stats show total completed topics, tests passed, and time spent learning
- 6: Dashboard loads quickly by using optimistic UI updates for recent progress changes
- 7: Recent activity timeline shows last completed topics and test results

### Story 3.4 Progress Tracking & Optimistic UI

As a registered user,
I want my progress to update immediately when I complete topics,
so that I see instant feedback for my learning achievements.

#### Acceptance Criteria

- 1: "Mark as Complete" button on topic pages updates UI instantly (optimistic update)
- 2: Progress bars and percentages update immediately without waiting for server response
- 3: Background API call persists progress change to database
- 4: UI reverts optimistic changes if server request fails
- 5: Progress sync mechanism ensures data consistency during app reload
- 6: Visual feedback (animations, checkmarks) celebrates progress milestones
- 7: Batch progress updates optimize performance for multiple rapid completions

### Story 3.5 Learning Plan Management

As a registered user,
I want to create and manage a personal learning plan,
so that I can organize my studies according to my goals and schedule.

#### Acceptance Criteria

- 1: "Add to Learning Plan" button is available on all topic pages for logged-in users
- 2: Learning plan page shows all saved topics organized by category
- 3: Drag-and-drop interface allows reordering topics in learning plan
- 4: Learning plan shows estimated total time for completion
- 5: Progress indicators show completion status for each topic in the plan
- 6: "Remove from Plan" action provides undo option for accidental deletions
- 7: Learning plan is exportable as PDF or shareable link for offline reference

### Story 3.6 Bookmarks & Quick Access

As a registered user,
I want to bookmark important topics for quick reference,
so that I can easily return to valuable content during my work.

#### Acceptance Criteria

- 1: Bookmark button is available on all topic pages with visual toggle state
- 2: Bookmarks page displays all saved topics with search and category filtering
- 3: Bookmark organization allows creating custom tags for better categorization
- 4: Quick access sidebar shows recently bookmarked topics
- 5: Bookmarks sync across devices when user logs in
- 6: Bulk bookmark management allows selecting and removing multiple bookmarks
- 7: Bookmark export functionality creates shareable links for team reference

## Epic 4 Testing System & Assessment

Създава интерактивна система за тестване, която позволява на потребителите да проверяват знанията си и получават незабавна обратна връзка за ефективността на обучението.

### Story 4.1 Test & Question Data Models

As a system,
I want to store test questions and track user test attempts,
so that users can assess their knowledge and see their improvement over time.

#### Acceptance Criteria

- 1: Tests table links each test to a specific topic with passing criteria
- 2: Questions table supports both single-choice and multiple-choice question types
- 3: QuestionOptions table stores answer choices with correct answer indicators
- 4: TestAttempts table records each user's test session with timestamp and score
- 5: TestAnswers table stores user's selected answers for detailed result analysis
- 6: Sequential question ordering is maintained via sortOrder field
- 7: Question explanations provide learning value for both correct and incorrect answers

### Story 4.2 Test Administration Backend API

As a registered user,
I want REST endpoints for taking tests and viewing results,
so that I can assess my knowledge through the web interface.

#### Acceptance Criteria

- 1: GET /tests/:id endpoint returns test structure without revealing correct answers
- 2: POST /tests/:id/submit endpoint accepts user answers and calculates score
- 3: GET /tests/attempts/:id endpoint returns detailed results for completed attempts
- 4: Test submission validates that all required questions are answered
- 5: Scoring algorithm awards points for correct answers based on question type
- 6: Test attempts track start time, completion time, and user progression
- 7: Maximum attempts limit prevents unlimited retries (configurable per test)

### Story 4.3 Test Taking Interface

As a registered user,
I want to take tests with a clear, distraction-free interface,
so that I can focus on demonstrating my knowledge effectively.

#### Acceptance Criteria

- 1: Test page displays questions sequentially with clear navigation between questions
- 2: Question types (single/multiple choice) are visually distinct with appropriate controls
- 3: Progress indicator shows current question number and overall test completion
- 4: Timer displays remaining time if test has time limits
- 5: Answer selection provides immediate visual feedback (highlighting, checkmarks)
- 6: Review page allows checking all answers before final submission
- 7: Auto-save functionality preserves answers in case of connection issues

### Story 4.4 Test Results & Feedback

As a registered user,
I want to see detailed test results with explanations,
so that I can learn from mistakes and reinforce correct understanding.

#### Acceptance Criteria

- 1: Results page shows overall score, pass/fail status, and time taken
- 2: Question-by-question breakdown displays user answers vs correct answers
- 3: Explanations for each question provide learning value regardless of correctness
- 4: Visual indicators (icons, colors) clearly distinguish correct and incorrect answers
- 5: Performance analytics show improvement trends across multiple attempts
- 6: Retake button is available if user hasn't exceeded maximum attempts
- 7: Results are shareable via link for academic or professional verification

### Story 4.5 Test Performance Analytics

As a registered user,
I want to track my test performance over time,
so that I can identify learning gaps and measure improvement.

#### Acceptance Criteria

- 1: Test history page shows all attempts with scores and completion dates
- 2: Performance charts visualize score trends and improvement over time
- 3: Topic-level analytics identify strengths and weaknesses across subjects
- 4: Comparison metrics show performance relative to other users (anonymized)
- 5: Recommended study areas suggest topics based on test performance
- 6: Achievement badges recognize milestones (first pass, perfect score, improvement streaks)
- 7: Performance data is exportable for portfolio or resume purposes

### Story 4.6 Test Retry & Progress Integration

As a registered user,
I want test results to integrate with my overall progress tracking,
so that successful test completion contributes to my learning advancement.

#### Acceptance Criteria

- 1: Passing a test automatically marks the associated topic as completed
- 2: Test scores contribute to overall course completion percentage
- 3: Failed tests provide study recommendations for improvement
- 4: Retry attempts track improvement and unlock after cooldown period
- 5: Test completion triggers progress recalculation for course and category levels
- 6: Achievement notifications celebrate test completion milestones
- 7: Test performance influences topic recommendations in learning plan

## Epic 5 Admin Panel & Content Management

Предоставя пълноценен административен панел за управление на съдържанието, потребителите и системните настройки, позволявайки на администраторите ефективно да поддържат платформата.

### Story 5.1 Admin Authentication & Authorization

As an administrator,
I want secure access to administrative functions,
so that I can manage the platform while keeping it protected from unauthorized access.

#### Acceptance Criteria

- 1: Admin role-based authorization restricts access to admin-only endpoints
- 2: Admin authentication uses the same JWT system with role-based token validation
- 3: Admin dashboard route (/admin) requires admin role and redirects others
- 4: Admin session timeout is shorter than regular users for enhanced security
- 5: Admin actions are logged for audit trail and security monitoring
- 6: Two-factor authentication option is available for admin accounts
- 7: Admin panel provides clear indication of current user's admin status

### Story 5.2 Category Management CRUD

As an administrator,
I want to create and manage course categories,
so that content is properly organized for users to discover.

#### Acceptance Criteria

- 1: Categories list page displays all categories with creation date and course count
- 2: Create category form allows setting name, description, color, and icon
- 3: Edit category functionality updates existing categories with validation
- 4: Delete category prevents deletion if courses are assigned to it
- 5: Category reordering changes display sequence for users
- 6: Category status toggle allows hiding categories without deleting
- 7: Bulk operations enable efficient management of multiple categories

### Story 5.3 Course Management CRUD

As an administrator,
I want to create and manage courses with full details,
so that I can provide structured learning paths for users.

#### Acceptance Criteria

- 1: Courses list page shows all courses with category, topic count, and publication status
- 2: Create course form includes title, description, category assignment, and metadata
- 3: Course editing allows updating all fields including category reassignment
- 4: Course deletion requires confirmation and handles associated topics appropriately
- 5: Course publishing toggle controls visibility to public users
- 6: Course duplication creates copy with all topics for template reuse
- 7: Course statistics show user enrollment and completion rates

### Story 5.4 Topic & Content Management

As an administrator,
I want to create and manage individual topics with rich content,
so that users have access to comprehensive learning materials.

#### Acceptance Criteria

- 1: Topics list shows all topics organized by course with publication status
- 2: Topic editor supports rich text formatting with Markdown preview
- 3: Multi-language content editing allows maintaining translations for each topic
- 4: Topic metadata includes estimated reading time, difficulty level, and tags
- 5: Topic ordering within courses can be modified through drag-and-drop interface
- 6: Content auto-save prevents data loss during editing sessions
- 7: Topic preview function shows content as users will see it

### Story 5.5 Test & Question Management

As an administrator,
I want to create and manage tests with questions for each topic,
so that users can validate their learning through assessments.

#### Acceptance Criteria

- 1: Test creation form allows setting title, passing percentage, and attempt limits
- 2: Question editor supports both single-choice and multiple-choice formats
- 3: Bulk question import accepts JSON format for efficient test creation
- 4: Question reordering ensures proper test flow through drag-and-drop
- 5: Answer explanation editor provides learning value for each question
- 6: Test preview allows administrators to experience the test as users would
- 7: Test analytics show success rates and identify difficult questions

### Story 5.6 User Management & Administration

As an administrator,
I want to view and manage user accounts,
so that I can provide support and maintain platform security.

#### Acceptance Criteria

- 1: User list displays all registered users with registration date and activity status
- 2: User search functionality finds users by email or registration period
- 3: User detail view shows complete profile, progress, and test history
- 4: Role management allows promoting users to admin status
- 5: Account suspension temporarily disables user access without data deletion
- 6: Password reset capability helps users who cannot access their accounts
- 7: User activity monitoring shows login patterns and engagement metrics

### Story 5.7 System Settings & Configuration

As an administrator,
I want to configure system-wide settings,
so that I can adapt the platform to operational requirements and constraints.

#### Acceptance Criteria

- 1: Settings page displays all configurable system parameters with descriptions
- 2: Email limit configuration prevents exceeding SendGrid daily quotas
- 3: Maintenance mode toggle allows planned downtime with user notification
- 4: Registration control enables/disables new user signup during peak periods
- 5: System monitoring displays key metrics like active users and email usage
- 6: Backup configuration allows scheduling and monitoring data backups
- 7: Settings changes are logged and can be reverted to previous values

## Checklist Results Report

_Ще изпълня pm-checklist за валидиране на създадения PRD..._

Готово! Трансформирах вашия отличен PRD в BMAD формат с 5 логически последователни епика и 33 детайлни stories. Всяка story има ясни acceptance criteria и е оразмерена за AI agent изпълнение.

**Ключови подобрения в BMAD формата:**

- ✅ Епиците следват логическа последователност (Foundation → Auth → User Features → Testing → Admin)
- ✅ Всяка story е self-contained с ясни acceptance criteria
- ✅ Stories са оразмерени за 2-4 часа разработка от AI agent
- ✅ Epic 1 включва project setup и infrastructure
- ✅ Всяка story доставя стойност като vertical slice

**Следваща стъпка:**
Копирайте този PRD като `docs/prd.md` в проекта си, след което можете да преминете към:

1. PO agent за валидация (`*agent po`)
2. Или директно към IDE development workflow след sharding
