# Интерактивна онлайн система за самостоятелно обучение
## Техническа спецификация и план за разработка

## Съдържание
1. [Обзор на проекта](#обзор-на-проекта)
2. [Функционални изисквания](#функционални-изисквания)
3. [Техническа архитектура](#техническа-архитектура)
4. [База данни](#база-данни)
5. [Сигурност](#сигурност)
6. [Инфраструктура](#инфраструктура)
7. [План за имплементация](#план-за-имплементация)

---

## 1. Обзор на проекта

### Цел
Създаване на интерактивна онлайн система за самостоятелно обучение с фокус върху:
- Лесна употреба от крайни потребители
- Проследяване на прогреса и оценяване на знанията
- Възможност за монетизация чрез реклами
- Събиране на данни за анализ и научни изследвания

### Технологичен стек
- **Frontend:** React (Codux)
- **Backend:** NestJS микросервиси
- **База данни:** PostgreSQL + Redis
- **Инфраструктура:** Docker, Nginx, Cloudflare
- **Мониторинг:** Prometheus + Grafana

---

## 2. Функционални изисквания

### 2.1. Потребителска автентикация и управление

#### Регистрация
- Регистрация само с email и парола
- Автоматично присвояване на роля 'student'
- Email верификация (препоръчително)

#### Вписване
- Стандартно вписване с email и парола
- JWT базирана автентикация
- Refresh token механизъм

#### Възстановяване на парола
- Изпращане на уникален линк на email
- Временен токен с ограничена валидност
- Сигурна форма за нова парола

#### Администраторски достъп
- Ръчно създаване на admin потребител (не през публичен API)
- Разширени права за управление на системата

### 2.2. Учебно съдържание

#### Курсове и глави
- Йерархична структура: Курс → Глави → Съдържание
- Поддръжка на различни типове съдържание (текст, видео, изображения)
- Версиониране на съдържанието

#### Проследяване на прогреса
- Автоматично проследяване при достигане край на страница
- Ръчно маркиране като "прочетено"
- Бутон "Следваща глава" с автоматично записване
- Измерване на време прекарано на страница
- Персонални статистики за напредък

### 2.3. Тестове и оценяване

#### Функционалности
- Различни типове въпроси (единичен избор, множествен избор, свободен текст)
- Времеви ограничения
- Автоматично оценяване
- Детайлни резултати и обратна връзка

#### Анализ и отчети
- Индивидуални резултати
- Агрегирани статистики
- Експорт на данни за изследвания

### 2.4. Рекламна система

#### Anti-adblocker стратегия
- Сървърно-рендерирани реклами
- Вградени изображения от същия домейн
- Динамични CSS класове
- Base64 кодирани изображения
- Избягване на ключови думи като "ad", "banner"

#### Функционалности
- Управление на рекламни кампании
- Проследяване на импресии и кликове
- Таргетиране по потребителски групи

---

## 3. Техническа архитектура

### 3.1. Микросервисна архитектура

```mermaid
graph TB
    subgraph "Cloudflare Edge Network"
        cf["Cloudflare CDN/WAF<br>(DDoS Protection, Global SSL)"]
    end
    
    subgraph "VPS Infrastructure"
        nginx["Nginx Gateway<br>(Origin SSL, Load Balancer)"]
        
        subgraph "Микросервиси"
            auth["Auth Service"]
            user["User Service"]
            course["Course Service"]
            test["Test Service"]
            analytics["Analytics Service"]
            ads["Ads Service"]
        end
        
        subgraph "Data Layer"
            postgres["PostgreSQL"]
            redis["Redis Cache"]
        end
    end
    
    client["Потребители"] --> cf
    cf --> nginx
    nginx --> auth & user & course & test & analytics & ads
```

### 3.2. Описание на микросервисите

#### Auth Service
- JWT token management
- Регистрация и вписване
- Възстановяване на пароли
- Session management

#### User Service
- Потребителски профили
- Управление на роли
- Потребителски настройки

#### Course Service
- CRUD операции за курсове
- Управление на съдържание
- Версиониране
- Проследяване на прогрес

#### Test Service
- Управление на тестове
- Обработка на отговори
- Оценяване и резултати

#### Analytics Service
- Събиране на данни
- Генериране на отчети
- Експорт функционалности

#### Ads Service
- Управление на реклами
- Anti-adblocker механизми
- Статистики и отчети

### 3.3. Детайлни схеми на микросервисите

#### Auth Service Schema

```mermaid
classDiagram
    class AuthController {
        +POST /auth/register
        +POST /auth/login
        +POST /auth/logout
        +POST /auth/refresh
        +POST /auth/forgot-password
        +POST /auth/reset-password
        +GET /auth/verify-email
    }
    
    class AuthService {
        -jwtService: JwtService
        -userRepository: UserRepository
        -emailService: EmailService
        -redisService: RedisService
        +register(dto: RegisterDto): Promise~AuthResponse~
        +login(dto: LoginDto): Promise~AuthResponse~
        +logout(userId: string): Promise~void~
        +refreshToken(token: string): Promise~AuthResponse~
        +forgotPassword(email: string): Promise~void~
        +resetPassword(token: string, password: string): Promise~void~
        +verifyEmail(token: string): Promise~void~
        +validateUser(email: string, password: string): Promise~User~
        +generateTokens(user: User): Promise~TokenPair~
    }
    
    class JwtStrategy {
        +validate(payload: JwtPayload): Promise~User~
    }
    
    class RefreshTokenGuard {
        +canActivate(context: ExecutionContext): Promise~boolean~
    }
    
    class SessionRepository {
        +create(session: Session): Promise~Session~
        +findByToken(token: string): Promise~Session~
        +invalidate(userId: string): Promise~void~
        +invalidateAll(userId: string): Promise~void~
    }
    
    class PasswordResetRepository {
        +create(reset: PasswordReset): Promise~PasswordReset~
        +findByToken(token: string): Promise~PasswordReset~
        +markAsUsed(id: number): Promise~void~
    }
    
    AuthController --> AuthService
    AuthService --> JwtService
    AuthService --> UserRepository
    AuthService --> EmailService
    AuthService --> RedisService
    AuthService --> SessionRepository
    AuthService --> PasswordResetRepository
    AuthController --> JwtStrategy
    AuthController --> RefreshTokenGuard
```

#### User Service Schema

```mermaid
classDiagram
    class UserController {
        +GET /users/profile
        +PUT /users/profile
        +GET /users/:id [Admin]
        +GET /users [Admin]
        +PUT /users/:id [Admin]
        +DELETE /users/:id [Admin]
        +POST /users/:id/deactivate [Admin]
        +GET /users/:id/sessions [Admin]
    }
    
    class UserService {
        -userRepository: UserRepository
        -profileRepository: UserProfileRepository
        -cacheService: RedisService
        +getProfile(userId: string): Promise~UserProfile~
        +updateProfile(userId: string, dto: UpdateProfileDto): Promise~UserProfile~
        +getAllUsers(pagination: PaginationDto): Promise~UserList~
        +getUserById(id: string): Promise~User~
        +updateUser(id: string, dto: UpdateUserDto): Promise~User~
        +deactivateUser(id: string): Promise~void~
        +getUserSessions(id: string): Promise~Session[]~
    }
    
    class UserRepository {
        +findById(id: string): Promise~User~
        +findByEmail(email: string): Promise~User~
        +create(user: User): Promise~User~
        +update(id: string, user: Partial~User~): Promise~User~
        +findAll(options: FindOptions): Promise~User[]~
    }
    
    class UserProfileRepository {
        +findByUserId(userId: string): Promise~UserProfile~
        +create(profile: UserProfile): Promise~UserProfile~
        +update(id: string, profile: Partial~UserProfile~): Promise~UserProfile~
    }
    
    class RoleGuard {
        +canActivate(context: ExecutionContext): Promise~boolean~
    }
    
    UserController --> UserService
    UserController --> RoleGuard
    UserService --> UserRepository
    UserService --> UserProfileRepository
    UserService --> RedisService
```

#### Course Service Schema

```mermaid
classDiagram
    class CourseController {
        +GET /courses
        +GET /courses/:id
        +POST /courses [Admin]
        +PUT /courses/:id [Admin]
        +DELETE /courses/:id [Admin]
        +GET /courses/:id/chapters
        +POST /courses/:id/chapters [Admin]
        +PUT /chapters/:id [Admin]
        +DELETE /chapters/:id [Admin]
        +GET /chapters/:id/content
        +POST /chapters/:id/content [Admin]
        +PUT /content/:id [Admin]
        +DELETE /content/:id [Admin]
        +GET /content/:id/versions [Admin]
        +POST /content/:id/publish [Admin]
        +POST /content/:id/revert [Admin]
        +GET /users/:userId/progress
        +POST /progress/update
        +POST /progress/complete
    }
    
    class CourseService {
        -courseRepository: CourseRepository
        -chapterRepository: ChapterRepository
        -contentRepository: ContentRepository
        -progressRepository: UserProgressRepository
        -cacheService: RedisService
        +getCourses(filters: CourseFilterDto): Promise~Course[]~
        +getCourseById(id: string): Promise~Course~
        +createCourse(dto: CreateCourseDto): Promise~Course~
        +updateCourse(id: string, dto: UpdateCourseDto): Promise~Course~
        +deleteCourse(id: string): Promise~void~
    }
    
    class ChapterService {
        -chapterRepository: ChapterRepository
        +getChaptersByCourse(courseId: string): Promise~Chapter[]~
        +createChapter(courseId: string, dto: CreateChapterDto): Promise~Chapter~
        +updateChapter(id: string, dto: UpdateChapterDto): Promise~Chapter~
        +deleteChapter(id: string): Promise~void~
        +reorderChapters(courseId: string, order: number[]): Promise~void~
    }
    
    class ContentService {
        -contentRepository: ContentRepository
        -versionRepository: ContentVersionRepository
        +getContentByChapter(chapterId: string): Promise~Content[]~
        +createContent(chapterId: string, dto: CreateContentDto): Promise~Content~
        +updateContent(id: string, dto: UpdateContentDto): Promise~Content~
        +deleteContent(id: string): Promise~void~
        +getVersionHistory(contentId: string): Promise~ContentVersion[]~
        +publishVersion(contentId: string, version: number): Promise~void~
        +revertToVersion(contentId: string, version: number): Promise~void~
    }
    
    class ProgressService {
        -progressRepository: UserProgressRepository
        -eventEmitter: EventEmitter2
        +getUserProgress(userId: string): Promise~UserProgress[]~
        +updateProgress(userId: string, contentId: string, progress: number): Promise~void~
        +markAsCompleted(userId: string, contentId: string): Promise~void~
        +getProgressStats(userId: string): Promise~ProgressStats~
    }
    
    CourseController --> CourseService
    CourseController --> ChapterService
    CourseController --> ContentService
    CourseController --> ProgressService
```

#### Test Service Schema

```mermaid
classDiagram
    class TestController {
        +GET /tests/chapter/:chapterId
        +GET /tests/:id
        +POST /tests [Admin]
        +PUT /tests/:id [Admin]
        +DELETE /tests/:id [Admin]
        +GET /tests/:id/questions
        +POST /tests/:id/questions [Admin]
        +PUT /questions/:id [Admin]
        +DELETE /questions/:id [Admin]
        +POST /tests/:id/start
        +POST /attempts/:attemptId/answer
        +POST /attempts/:attemptId/complete
        +GET /attempts/:attemptId/results
        +GET /users/:userId/test-history
    }
    
    class TestService {
        -testRepository: TestRepository
        -questionRepository: QuestionRepository
        -attemptRepository: UserTestAttemptRepository
        -answerRepository: UserAnswerRepository
        +getTestsByChapter(chapterId: string): Promise~Test[]~
        +getTestById(id: string): Promise~Test~
        +createTest(dto: CreateTestDto): Promise~Test~
        +updateTest(id: string, dto: UpdateTestDto): Promise~Test~
        +deleteTest(id: string): Promise~void~
    }
    
    class QuestionService {
        -questionRepository: QuestionRepository
        +getQuestionsByTest(testId: string): Promise~Question[]~
        +createQuestion(testId: string, dto: CreateQuestionDto): Promise~Question~
        +updateQuestion(id: string, dto: UpdateQuestionDto): Promise~Question~
        +deleteQuestion(id: string): Promise~void~
        +validateAnswer(questionId: string, answer: any): Promise~boolean~
    }
    
    class TestAttemptService {
        -attemptRepository: UserTestAttemptRepository
        -answerRepository: UserAnswerRepository
        -testRepository: TestRepository
        -eventEmitter: EventEmitter2
        +startTest(userId: string, testId: string): Promise~UserTestAttempt~
        +submitAnswer(attemptId: string, questionId: string, answer: any): Promise~UserAnswer~
        +completeTest(attemptId: string): Promise~TestResult~
        +getTestResults(attemptId: string): Promise~TestResult~
        +getUserTestHistory(userId: string): Promise~UserTestAttempt[]~
        +calculateScore(attemptId: string): Promise~number~
    }
    
    class TestValidationService {
        +validateTestStructure(test: Test): boolean
        +validateQuestionFormat(question: Question): boolean
        +checkTimeLimit(attempt: UserTestAttempt): boolean
    }
    
    TestController --> TestService
    TestController --> QuestionService
    TestController --> TestAttemptService
    TestAttemptService --> TestValidationService
```

#### Analytics Service Schema

```mermaid
classDiagram
    class AnalyticsController {
        +GET /analytics/user/:userId/progress
        +GET /analytics/test/:testId/statistics
        +GET /analytics/course/:courseId/completion
        +GET /analytics/reports/performance/:userId
        +GET /analytics/reports/aggregate
        +GET /analytics/content/engagement
        +POST /analytics/export
        +GET /analytics/dashboard [Admin]
    }
    
    class AnalyticsService {
        -progressRepository: UserProgressRepository
        -testRepository: UserTestAttemptRepository
        -courseRepository: CourseRepository
        -aggregationService: AggregationService
        +getUserProgressAnalytics(userId: string): Promise~UserAnalytics~
        +getTestStatistics(testId: string): Promise~TestStats~
        +getCourseCompletionRates(courseId: string): Promise~CompletionStats~
        +generatePerformanceReport(userId: string): Promise~PerformanceReport~
        +generateAggregateReport(filters: ReportFilters): Promise~AggregateReport~
        +getContentEngagement(contentId: string): Promise~EngagementMetrics~
    }
    
    class AggregationService {
        -clickhouse: ClickHouseClient
        +aggregateUserProgress(timeRange: TimeRange): Promise~AggregatedData~
        +aggregateTestResults(timeRange: TimeRange): Promise~AggregatedData~
        +calculateTrends(metric: string, period: string): Promise~TrendData~
    }
    
    class ExportService {
        -queueService: BullQueue
        +exportData(criteria: ExportCriteria): Promise~ExportJob~
        +generateCSV(data: any[]): Promise~Buffer~
        +generatePDF(report: Report): Promise~Buffer~
        +getExportStatus(jobId: string): Promise~ExportStatus~
    }
    
    class MetricsCollector {
        -eventEmitter: EventEmitter2
        +collectProgressMetric(event: ProgressEvent): void
        +collectTestMetric(event: TestEvent): void
        +collectEngagementMetric(event: EngagementEvent): void
    }
    
    AnalyticsController --> AnalyticsService
    AnalyticsService --> AggregationService
    AnalyticsController --> ExportService
    AnalyticsService --> MetricsCollector
```

#### Ads Service Schema

```mermaid
classDiagram
    class AdsController {
        +GET /ads/serve
        +POST /ads/view
        +POST /ads/click
        +GET /ads [Admin]
        +POST /ads [Admin]
        +PUT /ads/:id [Admin]
        +DELETE /ads/:id [Admin]
        +GET /ads/:id/statistics [Admin]
        +GET /ads/campaigns [Admin]
    }
    
    class AdsService {
        -adRepository: AdvertisementRepository
        -viewRepository: UserAdViewRepository
        -targetingService: TargetingService
        -antiBlockService: AntiAdblockService
        +getAd(userId: string, context: AdContext): Promise~Advertisement~
        +recordView(userId: string, adId: string): Promise~void~
        +recordClick(userId: string, adId: string): Promise~void~
        +createAd(dto: CreateAdDto): Promise~Advertisement~
        +updateAd(id: string, dto: UpdateAdDto): Promise~Advertisement~
        +getAdStatistics(id: string): Promise~AdStats~
    }
    
    class TargetingService {
        -userRepository: UserRepository
        -progressRepository: UserProgressRepository
        +getTargetedAds(userId: string, context: AdContext): Promise~Advertisement[]~
        +calculateRelevanceScore(user: User, ad: Advertisement): number
        +applyFrequencyCapping(ads: Advertisement[], userId: string): Advertisement[]
    }
    
    class AntiAdblockService {
        +generateDynamicClassName(): string
        +encodeImageBase64(imageUrl: string): Promise~string~
        +obfuscateAdMarkup(html: string): string
        +serverSideRender(ad: Advertisement): string
        +injectAdNatively(content: string, ad: string): string
    }
    
    class AdCampaignService {
        -campaignRepository: CampaignRepository
        +createCampaign(dto: CreateCampaignDto): Promise~Campaign~
        +manageBudget(campaignId: string): Promise~void~
        +pauseCampaign(campaignId: string): Promise~void~
        +getCampaignPerformance(id: string): Promise~CampaignStats~
    }
    
    AdsController --> AdsService
    AdsService --> TargetingService
    AdsService --> AntiAdblockService
    AdsController --> AdCampaignService
```

### 3.4. Междусервисна комуникация

```mermaid
flowchart LR
    subgraph "API Gateway"
        nginx[Nginx]
    end
    
    subgraph "Auth Domain"
        auth[Auth Service]
    end
    
    subgraph "User Domain"
        user[User Service]
    end
    
    subgraph "Course Domain"
        course[Course Service]
        progress[Progress Tracking]
    end
    
    subgraph "Test Domain"
        test[Test Service]
    end
    
    subgraph "Analytics Domain"
        analytics[Analytics Service]
    end
    
    subgraph "Ads Domain"
        ads[Ads Service]
    end
    
    subgraph "Shared Services"
        redis[(Redis)]
        postgres[(PostgreSQL)]
        rabbitmq[RabbitMQ]
    end
    
    nginx --> auth
    nginx --> user
    nginx --> course
    nginx --> test
    nginx --> analytics
    nginx --> ads
    
    auth <--> user
    course <--> progress
    course --> analytics
    test --> analytics
    progress --> analytics
    ads --> user
    ads --> analytics
    
    auth --> redis
    user --> redis
    course --> redis
    test --> redis
    
    auth --> postgres
    user --> postgres
    course --> postgres
    test --> postgres
    analytics --> postgres
    ads --> postgres
    
    course --> rabbitmq
    test --> rabbitmq
    analytics --> rabbitmq
    ads --> rabbitmq
```

---

## 4. База данни

### 4.1. Схема на базата данни

```mermaid
erDiagram
    User ||--o{ UserProfile : has
    User ||--o{ UserProgress : tracks
    User ||--o{ UserTestAttempt : takes
    User ||--o{ Session : maintains
    
    Course ||--o{ Chapter : contains
    Chapter ||--o{ Content : includes
    Chapter ||--o{ Test : assesses
    Chapter ||--o{ UserProgress : tracked_in
    
    Content ||--o{ ContentVersion : versioned_as
    Content ||--o{ UserProgress : progress_on
    
    Test ||--o{ Question : consists_of
    Test ||--o{ UserTestAttempt : completed_by
    
    UserTestAttempt ||--o{ UserAnswer : records
    Question ||--o{ UserAnswer : answered_by
    
    Advertisement ||--o{ UserAdView : shown_to
```

### 4.2. Ключови таблици

#### User
- Основна информация за автентикация
- Роли и права
- Security fields (failed_login_attempts, last_login)

#### Course/Chapter/Content
- Йерархична структура на учебното съдържание
- Поддръжка на версиониране
- Метаданни и настройки

#### UserProgress
- Детайлно проследяване на напредъка
- Време прекарано на съдържание
- Процент на завършеност

#### Test/Question/UserAnswer
- Гъвкава система за тестове
- Различни типове въпроси
- Детайлни резултати

---

## 5. Сигурност

### 5.1. Многопластова защита

```mermaid
flowchart TD
    A[Потребител] -->|HTTPS/TLS 1.3| B[Cloudflare Edge]
    B -->|Origin SSL| C[Nginx]
    C --> D[Security Middleware]
    D --> E[JWT Validation]
    E --> F[Rate Limiting]
    F --> G[Input Validation]
    G --> H[CORS/CSRF Protection]
    H --> I[Application Logic]
```

### 5.2. Ключови мерки за сигурност

#### Транспортен слой
- Cloudflare Edge SSL + Origin Certificate
- HSTS headers
- TLS 1.3 only

#### Автентикация и оторизация
- JWT с кратък access token (15-60 мин)
- Refresh tokens в HttpOnly cookies
- Ролеви модел на достъп

#### Защита от атаки
- **XSS:** CSP headers, output encoding, input sanitization
- **CSRF:** Double-submit cookies, SameSite attributes
- **SQL Injection:** ORM с параметризирани заявки
- **DDoS:** Cloudflare автоматична защита
- **Rate Limiting:** На ниво API endpoints

#### Защита на данните
- Bcrypt/Argon2 за пароли
- Уникални соли за всяка парола
- Валидация и санитизация на входните данни
- Audit logging за критични операции

### 5.3. Environment-based конфигурация

```typescript
// Development: Relaxed security за по-лесно тестване
// Test: Минимална security overhead
// Production: Максимална защита по подразбиране
```

---

## 6. Инфраструктура

### 6.1. VPS спецификации
- **CPU:** 6 vCPU ядра
- **RAM:** 12 GB
- **Storage:** 200 GB SSD / 100 GB NVMe
- **Traffic:** 32 TB

### 6.2. Разпределение на ресурсите

```mermaid
pie title VPS Resource Allocation
    "NestJS Services" : 2.5
    "PostgreSQL" : 1.5
    "Redis" : 0.5
    "Nginx" : 0.3
    "React Frontend" : 0.2
    "Monitoring" : 0.2
    "Buffer" : 0.8
```

### 6.3. Cloudflare интеграция

#### Предимства
- 60-80% намаляване на директен трафик
- Глобална CDN мрежа (300+ locations)
- Автоматична DDoS защита
- WAF и bot protection
- Origin IP скриване

#### Конфигурация
```yaml
ssl_mode: "Full (strict)"
security_level: "Medium"
always_use_https: true
hsts_enabled: true
bot_fight_mode: true
minify:
  css: true
  js: true
  html: true
```

### 6.4. Docker композиция

```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/ssl/cloudflare:/etc/ssl/cloudflare
    ports:
      - "80:80"
      - "443:443"
  
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: learning_platform
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
  
  # Микросервиси...
```

---

## 7. План за имплементация

### Фаза 1: Основна инфраструктура (1-2 седмици)
- [ ] Настройка на VPS и Docker среда
- [ ] Конфигурация на Cloudflare
- [ ] Настройка на Nginx с Origin SSL
- [ ] PostgreSQL и Redis setup
- [ ] Основна CI/CD pipeline

### Фаза 2: Автентикация и потребители (2-3 седмици)
- [ ] Auth Service с JWT
- [ ] User Service
- [ ] Регистрация и вписване
- [ ] Възстановяване на пароли
- [ ] Admin функционалности

### Фаза 3: Учебно съдържание (3-4 седмици)
- [ ] Course Service
- [ ] Content management
- [ ] Версиониране
- [ ] Progress tracking
- [ ] Frontend за преглед на курсове

### Фаза 4: Тестове и оценяване (2-3 седмици)
- [ ] Test Service
- [ ] Различни типове въпроси
- [ ] Автоматично оценяване
- [ ] Резултати и статистики

### Фаза 5: Анализи и реклами (2 седмици)
- [ ] Analytics Service
- [ ] Ads Service с anti-adblocker
- [ ] Отчети и експорт

### Фаза 6: Финализиране (1-2 седмици)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Мониторинг setup
- [ ] Документация
- [ ] Deployment

### Общо време за разработка: ~13-16 седмици

---

## Допълнителни препоръки

### Бъдещи подобрения
1. **Мобилно приложение** - React Native за по-добра мобилна поддръжка
2. **Gamification** - точки, значки, класации за мотивация
3. **AI асистент** - персонализирани препоръки за обучение
4. **Live sessions** - възможност за уебинари и live обучения
5. **Интеграции** - Google Calendar, Zoom, MS Teams

### Технически подобрения
1. **GraphQL** - за по-ефективно извличане на данни
2. **WebSockets** - за real-time функционалности
3. **Elasticsearch** - за подобрено търсене в съдържанието
4. **S3 storage** - за медийни файлове
5. **Kubernetes** - при нужда от по-сериозно скалиране

### Мониторинг и поддръжка
1. **Automated backups** - ежедневни бекъпи на БД
2. **Health checks** - автоматични проверки на услугите
3. **Error tracking** - Sentry или подобен инструмент
4. **A/B testing** - за оптимизиране на UX
5. **User feedback** - система за обратна връзка