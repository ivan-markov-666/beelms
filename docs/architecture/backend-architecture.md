# Backend Service Patterns

## Архитектурен подход

QA-4-Free използва микросервисна архитектура, изградена с NestJS. Всеки микросервис е проектиран като независим компонент, който може да се разработва, тества, скалира и разгръща отделно, позволявайки гъвкавост и устойчивост на системата.

## Основни принципи

1. **Независимост на сервизите** - Всеки микросервис е независимо приложение с минимална свързаност с други сервиси
2. **Единична отговорност** - Всеки сервис отговаря за точно определена бизнес функционалност
3. **Изолирани данни** - Всеки микросервис има собствена база данни или схема
4. **REST комуникация** - Стандартизирани REST API интерфейси за комуникация между сервисите
5. **Автентикация чрез JWT** - Единна автентикация между всички микросервиси
6. **Контейнеризация** - Docker контейнери за унифицирано разгръщане

## Структура на микросървис

Всеки микросервис следва стандартна NestJS архитектура със следните слоеве:

```
микросервис/
├── src/
│   ├── main.ts                  # Входна точка на приложението
│   ├── app.module.ts            # Основен модул
│   ├── config/                  # Конфигурационни настройки
│   ├── modules/                 # Функционални модули
│   │   └── feature/             # Функционалност
│   │       ├── dto/             # Data Transfer Objects
│   │       ├── entities/        # Модели на данни
│   │       ├── feature.module.ts
│   │       ├── feature.controller.ts
│   │       ├── feature.service.ts
│   │       └── feature.repository.ts
│   ├── common/                 # Общи компоненти
│   │   ├── decorators/         # Потребителски декоратори
│   │   ├── filters/            # Филтри за обработка на грешки
│   │   ├── guards/             # Guards за сигурност
│   │   ├── middlewares/        # Middlewares
│   │   ├── interceptors/       # Interceptors
│   │   └── utils/              # Utility функции
│   └── interfaces/             # Интерфейси и типове
└── test/                       # Тестове
```

## Микросервиси в системата

### Auth Service

Отговаря за всички аспекти на автентикацията и оторизацията.

**Основни функционалности:**
- JWT token генериране и валидация
- Регистрация и вписване на потребители
- Възстановяване на пароли
- Управление на сесии
- Управление на refresh tokens

**Типични образци:**
- JWT Strategy
- Guards (Auth, Role, Permission)
- Password hashing с Bcrypt
- Токен blacklisting с Redis

### User Service

Управление на потребителски профили и роли.

**Основни функционалности:**
- CRUD операции за потребителски профили
- Управление на потребителски роли и права
- Потребителски настройки

**Типични образци:**
- Repository pattern за абстракция на данните
- CQRS за по-сложни операции
- Data Transfer Objects (DTOs) с валидация

### Course Service

Управление на учебно съдържание и проследяване на прогрес.

**Основни функционалности:**
- CRUD за курсове, глави и съдържание
- Версиониране на съдържание
- Проследяване на потребителски прогрес

**Типични образци:**
- Hierarchical data модел (курс -> глави -> съдържание)
- Soft delete за съдържание
- Service-Repository pattern
- Redis кеширане за популярно съдържание

### Test Service

Управление на тестове, въпроси и оценяване.

**Основни функционалности:**
- Управление на тестове и въпроси
- Обработка на потребителски отговори
- Оценяване и генериране на резултати

**Типични образци:**
- Factory pattern за различни типове въпроси
- Strategy pattern за оценяване
- Event-driven architecture за асинхронно оценяване

### Analytics Service

Събиране и анализ на данни.

**Основни функционалности:**
- Събиране на данни за използването на платформата
- Генериране на отчети и статистики
- Експорт на данни

**Типични образци:**
- Observer pattern за събиране на събития
- ETL процеси за данни
- Aggregation pipelines

### Ads Service

Управление на реклами и anti-adblocker стратегии.

**Основни функционалности:**
- Управление на рекламни кампании
- Проследяване на импресии и кликове
- Anti-adblocker механизми
- Статистики и отчети

**Типични образци:**
- Strategy pattern за различни видове реклами
- Observer pattern за проследяване на събития
- Encryption Service за криптиране на чувствителни данни

**Забележка:** Ads Service работи на порт 3210 и е достъпен на http://localhost:3210, а Swagger UI на http://localhost:3210/api.

## Междусервизна комуникация

### REST API

Основният метод за комуникация между сервисите е чрез REST API с JSON формат. Всички публични API ендпойнти следват формата `/api/v{n}`.

### Event-Driven Communication

За асинхронни операции и публикуване на събития между сервисите се използват message brokers (напр. RabbitMQ).

Типични събития:
- `user.created` - при регистрация на нов потребител
- `user.updated` - при промяна на потребителски данни
- `course.completed` - при завършване на курс
- `test.submitted` - при предаване на тест

## Сигурност

### Автентикация

JWT базирана автентикация с:
- Access token (кратък живот)
- Refresh token (по-дълъг живот)
- Token blacklisting

### Комуникационна сигурност

- HTTPS/TLS за всички API заявки
- Криптиране на чувствителни данни с EncryptionService
- Валидация на входящите данни с class-validator
- Rate limiting за предпазване от DoS атаки
- CORS правила за ограничаване на cross-origin заявки

### Криптиране на данни

За криптиране на чувствителни данни се използва EncryptionService с конфигуриран ENCRYPTION_KEY в .env файловете на съответните сервиси.

## Управление на конфигурации

- Среда (.env файлове) за локални настройки
- Конфигурационни файлове за среда-специфични настройки (dev, staging, production)
- NestJS ConfigModule за достъп до конфигурации

## Стандартни шаблони за имплементация

### Controller-Service-Repository Pattern

```typescript
// controller.ts
@Controller('resource')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  findAll(@Query() query: FindAllDto): Promise<Resource[]> {
    return this.resourceService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreateResourceDto): Promise<Resource> {
    return this.resourceService.create(dto);
  }
}

// service.ts
@Injectable()
export class ResourceService {
  constructor(private readonly resourceRepository: ResourceRepository) {}

  async findAll(query: FindAllDto): Promise<Resource[]> {
    return this.resourceRepository.findAll(query);
  }

  async create(dto: CreateResourceDto): Promise<Resource> {
    // Бизнес логика тук
    const resource = new Resource();
    resource.name = dto.name;
    // ...
    return this.resourceRepository.create(resource);
  }
}

// repository.ts
@Injectable()
export class ResourceRepository {
  constructor(
    @InjectRepository(Resource)
    private readonly repository: Repository<Resource>,
  ) {}

  async findAll(query: FindAllDto): Promise<Resource[]> {
    return this.repository.find({
      where: { /* филтри базирани на query */ },
    });
  }

  async create(resource: Resource): Promise<Resource> {
    return this.repository.save(resource);
  }
}
```

### DTO и Валидация

```typescript
export class CreateResourceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;
}
```

### Guards и Декоратори

```typescript
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// roles.decorator.ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// controller usage
@Post()
@Roles('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
create(@Body() dto: CreateResourceDto): Promise<Resource> {
  // ...
}
```

## Логиране и мониторинг

- Структурирано логиране с Winston
- Трасиране на заявки с единен request ID
- Метрики с Prometheus
- Визуализация с Grafana
- Централизирано събиране на логове с ELK Stack

## Документация и тестване

- Автоматично генерирана API документация с Swagger (OpenAPI)
- Unit тестове с Jest
- E2E тестове с Supertest
- Тестване на integration flows

## Стратегия за разгръщане

- Docker контейнеризация на всеки микросервис
- Docker Compose за локална разработка
- CI/CD pipeline за автоматизирано тестване и разгръщане
- Rolling updates за минимално време на недостъпност
