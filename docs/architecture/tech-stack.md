# Технологичен стак

## Обобщение на стака

Нашата LMS платформа е изградена на базата на модерен технологичен стак със следните основни компоненти:

| Категория | Технология | Версия | Бележки |
|-----------|------------|--------|---------|
| **Backend** | NestJS | 10.x | Типизиран Node.js фреймуърк с модулна структура |
| **Frontend** | React | 18.x | С използване на Codux за UI разработка |
| **Database** | PostgreSQL | 15.x | Основна релационна база данни |
| **Caching** | Redis | 7.x | За кеширане и управление на сесии |
| **API Gateway** | Nginx | Latest | Маршрутизация и балансиране на натоварването |
| **Message Queue** | RabbitMQ | 3.12.x | За асинхронна комуникация |
| **CDN/Security** | Cloudflare | - | CDN, WAF и DDoS защита |
| **Контейнеризация** | Docker | - | Containerization на всички услуги |
| **Оркестрация** | Docker Compose | 3.8 | За разработка и тестова среда |
|  | Kubernetes | 1.28+ | За production среда |
| **CI/CD** | GitHub Actions | - | Автоматизирани workflow-и |
| **Мониторинг** | Prometheus/Grafana | Latest | Наблюдение и визуализация |
| **Логове** | ELK Stack | 8.x | Централизирано събиране на логове |

## Детайлни спецификации по компоненти

### Backend (Microservices)

#### NestJS Framework
- **Версия**: 10.x
- **Език**: TypeScript 5.x с `"strict": true` настройка
- **Основни пакети**:
  - `@nestjs/core`, `@nestjs/common` - Основни NestJS компоненти
  - `@nestjs/typeorm` - TypeORM интеграция за PostgreSQL
  - `@nestjs/swagger` - Автоматична API документация
  - `@nestjs/config` - Управление на конфигурации
  - `@nestjs/jwt` - JWT автентикация
  - `@nestjs/passport` - Passport.js интеграция
  - `@nestjs/throttler` - Rate limiting функционалност
  - `@nestjs/event-emitter` - Event-driven архитектура
  - `@nestjs/microservices` - Поддръжка на микросервисна комуникация
  - `@nestjs/bull` - Queue интеграция за фонови задачи
  - `@nestjs/schedule` - Cron jobs и планирани задачи
  - `@nestjs/terminus` - Health checks

#### ORM и бази данни
- **TypeORM**:
  - Версия: 0.3.x
  - Функционалности: миграции, релации, транзакции
  - Използване на Repository pattern
- **PostgreSQL**:
  - Версия: 15.x 
  - Разширения: `PostGIS`, `pg_trgm`, `uuid-ossp`
- **Redis**:
  - Версия: 7.x
  - Приложения: Кеширане, rate limiting, сесии

#### Тестване
- **Jest**: Unit и Integration тестове
  - `@nestjs/testing` - NestJS специфична тестова инфраструктура
- **Supertest**: За E2E тестове на API
- **Pactum**: За Contract тестване
- **k6**: За Load тестване

#### Monitoring & Observability
- **Prometheus Client**: За експорт на метрики
- **Winston**: За структурирани логове
- **OpenTelemetry**: За distributed tracing
- **Sentry**: За real-time error monitoring

### Frontend

#### React
- **Версия**: 18.x
- **Язик**: TypeScript 5.x
- **UI библиотеки**: 
  - MUI (Material-UI) v5.x - За основни UI компоненти
  - Tailwind CSS v3.x - За стилове
  - React Router v6.x - За рутиране
  - React Query v5.x - За data fetching
  - Redux Toolkit v2.x - За state management
  - Axios - За HTTP заявки
  - i18next - За интернационализация
  - React Hook Form - За форми

#### Development Tools
- **Codux**: Визуален редактор за React компоненти
- **Vite**: За бърз development server и build оптимизации
- **ESLint**: За статичен анализ с правила за React и TypeScript
- **Prettier**: За форматиране на кода
- **Storybook**: За разработка и тестване на UI компоненти в изолация

#### Тестване
- **Vitest**: За unit тестване на компоненти
- **React Testing Library**: За component testing
- **Cypress**: За E2E тестване
- **MSW (Mock Service Worker)**: За мокиране на API заявки

### DevOps & Инфраструктура

#### Containerization
- **Docker**: Lightweight Alpine-базирани контейнери за всички услуги
- **Docker Compose**: За локална разработка и тестова среда
- **Kubernetes**: За production deployment с:
  - Helm charts
  - Horizontal Pod Autoscaling
  - Liveness/Readiness probes
  - Resource quotas и limits

#### CI/CD Pipeline
- **GitHub Actions**: Автоматизиран workflow със следните етапи:
  - Static code analysis (ESLint, SonarQube)
  - Unit тестове
  - Integration тестове
  - Build и контейнеризация
  - Security scanning (Snyk, Trivy)
  - Deployment в съответната среда

#### Мониторинг и Логове
- **Prometheus**: За събиране на метрики
- **Grafana**: За визуализация с предефинирани дашборди
- **Loki**: За централизирано събиране на логове
- **Tempo**: За distributed tracing
- **Alertmanager**: За известия и аларми

#### Security Tools
- **OWASP ZAP**: За security scanning
- **JWT**: За stateless authentication
- **HTTPS**: TLS 1.3 за всички endpoint-и
- **Vault**: За управление на secrets
- **ModSecurity**: WAF защита

### Messaging & Event Driven Architecture

#### RabbitMQ
- **Версия**: 3.12.x
- **Топология**:
  - Direct exchanges за команди
  - Fanout exchanges за събития
  - Topic exchanges за маршрутизиране
- **Patterns**:
  - Publish/Subscribe
  - RPC (Remote Procedure Call)
  - Work Queues за балансиране на натоварването

#### Bull Queue
- **Версия**: 4.x
- **Функционалности**:
  - Scheduled jobs
  - Delayed processing
  - Prioritization
  - Concurrency control
  - Retry strategies

### Data Storage & Processing

#### PostgreSQL
- **Версия**: 15.x
- **Стратегии за оптимизация**:
  - Partitioning на големи таблици
  - Индексиране на често използвани полета
  - Query performance оптимизации
  - Connection pooling с PgBouncer

#### Redis
- **Версия**: 7.x
- **Конфигурация**:
  - Persistence: RDB + AOF
  - Sentinel за висока достъпност
  - Redis streams за event logging

#### Elasticsearch (част от ELK Stack)
- **Версия**: 8.x
- **Приложения**:
  - Full-text search на курсове
  - Анализ на логове
  - Aggregated analytics

### API Standards & Documentation

#### API Документация
- **Swagger/OpenAPI**: 3.x
  - Автоматично генерирана
  - Интерактивен UI за тестване
  - Export в различни формати

#### API Standards
- **REST принципи**:
  - Правилно използване на HTTP методи
  - Статус кодове според спецификация
  - Консистентен формат на отговорите
  - Pagination, filtering, sorting
- **Error Handling**:
  - Консистентен формат на грешки
  - Подробни съобщения за грешки
  - Error codes

## Версии на средата за разработка

### Препоръчителни инструменти за разработчици
- **Node.js**: 20.x LTS
- **npm**: 10.x
- **VS Code**: Latest с препоръчителни екстеншъни:
  - ESLint
  - Prettier
  - Docker
  - GitLens
  - Jest Runner
  - PostgreSQL
  - REST Client
- **Git**: 2.40+
- **Docker Desktop**: Latest

### Изисквания за системна конфигурация
- 8GB+ RAM (препоръчително 16GB)
- 4+ CPU Cores
- 50GB+ свободно място
- Windows 11, macOS 13+, или Linux

## Интеграция с външни API & услуги

### Платежни системи
- Stripe API - За плащания за курсове и абонаменти
- PayPal - Като алтернативен метод за плащане

### Email услуги
- SendGrid - За трансакционни имейли
- Mailchimp - За email маркетинг кампании

### Analytics
- Google Analytics 4 - За потребителско поведение
- Hotjar - За анализ на user experience

### Storage
- AWS S3 - За съхраняване на статично съдържание и файлове
- Cloudinary - За управление на изображения и видео

### Authentication providers
- Google OAuth - За social login
- Microsoft OAuth - За интеграция с корпоративни системи
- GitHub OAuth - За developer accounts

## Информация за средите

| Среда | Хостинг | Достъп | Информация |
|-------|---------|--------|------------|
| **Разработка** | Локален Docker Compose | Само за разработчици | `.env.development` |
| **Тестване** | VPS/Kubernetes | Тестов екип, разработчици | `.env.test` |
| **Staging** | VPS/Kubernetes | Вътрешен достъп + клиенти | `.env.staging` |
| **Production** | VPS/Kubernetes + Cloudflare | Публичен | `.env.production` |

## Качество на кода и Code Health

В съответствие с нашата фирмена политика за качество на кода, прилагаме следните практики:

1. Стриктен TypeScript със `"strict": true` в tsconfig.json
2. ESLint с препоръчани и къстъм правила
3. Prettier за консистентен стил на кода
4. Husky pre-commit hooks за:
   - Lint проверки
   - Type checking
   - Unit тестове
   - Conventional commits
5. SonarQube интеграция за:
   - Code quality анализ
   - Code coverage tracking
   - Дълбок статичен анализ
   - Повтарящ се код
6. Цели за code coverage – виж [Test Strategy](../test-strategy.md)
7. Zero compiler errors policy
8. Редовни code reviews на всеки Pull Request

## Сигурност

За осигуряване на високо ниво на сигурност, имплементираме:

1. Authentication:
   - JWT със secure cookies
   - CSRF защита
   - Refresh token ротация
   - Rate limiting на auth endpoints
   
2. Authorization:
   - Role-based access control (RBAC)
   - Attribute-based access control (ABAC)
   - Fine-grained permissions
   
3. Data Protection:
   - End-to-end encryption за чувствителни данни
   - Псевдонимизация на лични данни
   - GDPR compliance features
   
4. Network:
   - TLS 1.3 навсякъде
   - Cloudflare WAF
   - IP whitelisting за admin endpoints
   
5. Infrastructure:
   - Regular vulnerability scanning
   - Secret management с Vault
   - Least privilege principle
   - Container security scanning
