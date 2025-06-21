# Структура на проекта

## Стандартна структура на микросервисите

За осигуряване на последователност и лесна поддръжка, всички микросервиси ще следват една обща структура. Това улеснява разработчиците да се ориентират в различните микросервиси, да следват общи практики и да споделят инфраструктурен код.

### Основна структура на директориите

Всеки микросервис трябва да следва следната структура:

```
[service-name]/
├── src/
│   ├── config/                  # Конфигурационни файлове
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── environment.ts
│   ├── controllers/             # REST API контролери
│   │   └── [resource].controller.ts
│   ├── services/                # Бизнес логика
│   │   └── [resource].service.ts
│   ├── repositories/            # Достъп до данни
│   │   └── [resource].repository.ts
│   ├── models/                  # Модели на данните
│   │   ├── entities/            # Модели за базата данни
│   │   │   └── [resource].entity.ts
│   │   └── dto/                 # Data Transfer Objects
│   │       ├── requests/
│   │       │   └── [resource]-request.dto.ts
│   │       └── responses/
│   │           └── [resource]-response.dto.ts
│   ├── interfaces/              # Интерфейси и типове
│   │   └── [resource].interface.ts
│   ├── middleware/              # Middleware функции
│   │   ├── auth.middleware.ts
│   │   └── logging.middleware.ts
│   ├── guards/                  # Guards за защита на endpoint-и
│   │   ├── role.guard.ts
│   │   └── jwt.guard.ts
│   ├── decorators/              # Кастъм декоратори
│   │   └── roles.decorator.ts
│   ├── events/                  # Събития и Event Listeners
│   │   ├── listeners/
│   │   │   └── [event].listener.ts
│   │   └── publishers/
│   │       └── [event].publisher.ts
│   ├── utils/                   # Помощни функции
│   │   ├── validators/
│   │   ├── formatters/
│   │   └── helpers/
│   ├── exceptions/              # Кастъм exception класове
│   │   └── [type].exception.ts
│   ├── constants/               # Константи използвани в приложението
│   │   └── [type].constants.ts
│   └── app.module.ts            # Основен модул на приложението
├── test/                        # Тестове
│   ├── unit/
│   │   └── [resource].spec.ts
│   ├── integration/
│   │   └── [resource].integration.spec.ts
│   └── e2e/
│       └── [feature].e2e-spec.ts
├── migrations/                  # Database миграции
│   └── [timestamp]-[description].ts
├── docker/                      # Docker конфигурация
│   ├── Dockerfile
│   └── docker-compose.yml
├── scripts/                     # Скриптове за deployment, CI/CD, etc.
├── .env.example                 # Пример за environment variables
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js               # Конфигурация за тестове
└── README.md
```

## Общи конвенции за именуване

За всички микросервиси се прилагат следните конвенции за именуване:

- **Файлове**: kebab-case (пр. `user-progress.service.ts`, `auth-middleware.ts`)
- **Класове**: PascalCase (пр. `UserProgressService`, `AuthMiddleware`)
- **Интерфейси**: PascalCase с префикс I (пр. `IUserProfile`, `ITestAttempt`)
- **Константи**: UPPER_SNAKE_CASE (пр. `MAX_LOGIN_ATTEMPTS`, `DEFAULT_CACHE_TTL`)
- **Променливи и функции**: camelCase (пр. `getUserById`, `validateAuthToken`)
- **Модули**: camelCase (пр. `authModule`, `testModule`)

## Специфични особености по микросервиси

### Auth Service

```
auth-service/
├── ...стандартна структура
├── src/
│   ├── strategies/             # Passport/Authentication стратегии
│   │   ├── jwt.strategy.ts
│   │   ├── refresh-token.strategy.ts
│   │   └── local.strategy.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── jwt.service.ts
│   │   └── email.service.ts    # За изпращане на мейли при регистрация, забравена парола и др.
│   ├── models/
│   │   └── entities/
│   │       ├── user.entity.ts
│   │       ├── session.entity.ts
│   │       └── password-reset.entity.ts
```

### User Service

```
user-service/
├── ...стандартна структура
├── src/
│   ├── services/
│   │   ├── user.service.ts
│   │   ├── profile.service.ts
│   │   └── role.service.ts
│   ├── models/
│   │   └── entities/
│   │       ├── user.entity.ts
│   │       ├── profile.entity.ts
│   │       └── role.entity.ts
```

### Course Service

```
course-service/
├── ...стандартна структура
├── src/
│   ├── services/
│   │   ├── course.service.ts
│   │   ├── chapter.service.ts
│   │   ├── content.service.ts
│   │   └── progress.service.ts
│   ├── models/
│   │   └── entities/
│   │       ├── course.entity.ts
│   │       ├── chapter.entity.ts
│   │       ├── content.entity.ts
│   │       ├── content-version.entity.ts
│   │       └── user-progress.entity.ts
```

### Test Service

```
test-service/
├── ...стандартна структура
├── src/
│   ├── services/
│   │   ├── test.service.ts
│   │   ├── question.service.ts
│   │   └── attempt.service.ts
│   ├── models/
│   │   └── entities/
│   │       ├── test.entity.ts
│   │       ├── question.entity.ts
│   │       ├── user-test-attempt.entity.ts
│   │       └── user-answer.entity.ts
```

### Analytics Service

```
analytics-service/
├── ...стандартна структура
├── src/
│   ├── services/
│   │   ├── analytics.service.ts
│   │   ├── aggregation.service.ts
│   │   └── export.service.ts
│   ├── collectors/             # Колектори за събиране на метрики
│   │   ├── progress-collector.ts
│   │   ├── test-collector.ts
│   │   └── engagement-collector.ts
│   ├── models/
│   │   └── entities/
│   │       ├── metric.entity.ts
│   │       ├── report.entity.ts
│   │       └── export-job.entity.ts
```

### Ads Service

```
ads-service/
├── ...стандартна структура
├── src/
│   ├── services/
│   │   ├── ads.service.ts
│   │   ├── targeting.service.ts
│   │   ├── anti-adblock.service.ts
│   │   └── campaign.service.ts
│   ├── models/
│   │   └── entities/
│   │       ├── advertisement.entity.ts
│   │       ├── campaign.entity.ts
│   │       ├── user-ad-view.entity.ts
│   │       └── user-ad-click.entity.ts
```

## Shared Libraries/Common Code

За да се избегне дублиране на код между микросервисите, създаваме общ пакет с споделени функционалности:

```
shared-lib/
├── src/
│   ├── decorators/            # Общи декоратори
│   ├── guards/                # Общи guards
│   ├── interfaces/            # Общи интерфейси
│   ├── dto/                   # Общи DTO модели
│   ├── middleware/            # Общи middleware функции
│   │   ├── logging.middleware.ts
│   │   └── request-id.middleware.ts
│   ├── exceptions/            # Общи exception класове
│   ├── filters/               # Общи exception филтри
│   ├── utils/                 # Помощни функции
│   │   ├── pagination.util.ts
│   │   └── validation.util.ts
│   └── constants/             # Общи константи
├── package.json
├── tsconfig.json
└── README.md
```

## Инфраструктура за микросервиси

```
infrastructure/
├── api-gateway/               # Nginx конфигурация
│   ├── nginx.conf
│   └── Dockerfile
├── docker/                    # Docker Compose файлове
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
├── kubernetes/                # Kubernetes конфигурация
│   ├── deployments/
│   ├── services/
│   └── ingress/
├── terraform/                 # IaC за cloud environment
├── monitoring/                # Prometheus, Grafana конфигурация
├── logging/                   # ELK Stack или друго решение
├── scripts/                   # CI/CD скриптове
└── README.md
```

## Стратегия за тестване

Всеки микросервис трябва да има:

1. **Unit тестове** - тестват отделни компоненти в изолация
2. **Integration тестове** - тестват интеграцията между компонентите
3. **E2E тестове** - тестват пълна функционалност end-to-end

## Препоръки за Development Workflow

1. Използване на **Git Flow** с feature branches
2. Всички PR-и изискват code review от поне един програмист
3. Автоматично тестване при всеки commit с GitHub Actions или друг CI инструмент
4. Изисква се минимум 80% code coverage за unit тестове
5. Следване на semantic versioning за всички микросервиси
6. Документиране на всички промени в CHANGELOG файл
