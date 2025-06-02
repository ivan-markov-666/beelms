# Интерактивна онлайн система за самостоятелно обучение

## Описание

Тази система е изградена за осигуряване на интерактивно онлайн обучение с възможности за проследяване на прогреса, решаване на тестове и анализ на резултатите.

## Технологии

- **Backend**: NestJS с TypeScript
- **Frontend**: React с Codux
- **База данни**: PostgreSQL
- **Кеширане**: Redis
- **Контейнеризация**: Docker
- **API Gateway**: Nginx

## Архитектура

Системата използва микросервисна архитектура със следните компоненти:

- Auth Service - Автентикация и авторизация
- User Service - Управление на потребители
- Course Service - Управление на курсове и глави
- Test Service - Управление на тестове и въпроси
- Analytics Service - Събиране и анализ на данни
- Ads Service - Управление на реклами

## Предпоставки

- Docker Desktop
- Node.js (за локална разработка)
- Git

## Регресионно тестване

### Regression Test Suite

Централизиран набор от тестове за валидиране на цялостната функционалност на системата. Съдържа всички основни тестове, изброени по-долу.

**Как да изпълните регресионните тестове:**

```powershell
# За да изпълните всички тестове
.\regression-suite.ps1

# За да изпълните конкретен тест
.\regression-suite.ps1 -TestName "TestDevelopmentEnvironment"

# За да генерирате HTML отчет
.\regression-suite.ps1 -GenerateReport
```

**Включени тестове:**
- `TestDevelopmentEnvironment` - Валидира конфигурацията на средата за разработка
- `TestDatabaseMigrations` - Тества базата данни и миграциите
- `TestAnalyticsIntegration` - Тества всички основни ендпойнти на Analytics Service
  - Създаване на аналитични събития
  - Извличане на потребителски прогрес
  - Генериране на отчети за тестове и курсове
  - Експорт на аналитични данни

## Тестване на средата и базата данни

### Тестване на средата за разработка

Всеки път, когато обновим някой Dockerfile или docker-compose.yml файл, трябва да тестваме дали всичко работи коректно. Затова можем да изпълним автоматизиран тест на средата, за да проверите дали всичко е правилно настроено:

```bash
# В PowerShell на Windows
.\validate-docker-infrastructure.ps1

# В Linux с PowerShell Core
./validate-docker-infrastructure.ps1
```

### Тест за връзка с базата данни и зареждане на миграции

Този тест проверява дали връзката към PostgreSQL работи правилно и дали TypeORM успешно открива и зарежда миграционните класове.

**Валидира:**

- Успешна връзка към базата данни
- Правилно конфигуриране на TypeORM
- Коректно откриване на миграционните файлове

**Изпълнение:**

```bash
cd db/migrations
npx ts-node tests/db-migration-connection-test.ts
```

За по-подробна информация относно тестовете на миграциите, моля, вижте TESTS.md.

### Тестване на миграциите на базата данни

Можете да стартирате тестовете на миграциите на базата данни, за да проверите дали те работят правилно:

````bash
# Навигирайте до директорията с миграциите
cd db/migrations

# Изпълнете тестовете с npm и детекция на отворени връзки
npm test

# Или използвайте специализирания скрипт за директно тестване
cd ../..  # връщане в основната директория
./db/scripts/run-migrations-tests.sh

# За тестване в изолирана Docker среда
./db/scripts/run-docker-tests.sh

# Можете също да тествате само връзката и зареждането на миграциите:
cd db/migrations
npx ts-node tests/db-migration-connection-test.ts

За подробности относно всички тестове, моля, вижте [TESTS.md](TESTS.md).

## Бърз старт

1. Клонирайте хранилището:

```bash
git clone <repository-url>
cd learning-platform
````

2. Копирайте файла с примерни променливи и конфигурирайте:

```bash
cp .env.example .env
# Редактирайте .env файла със своите настройки
```

3. Изградете контейнерите:

```bash
docker-compose build
```

4. Стартирайте системата:

```bash
docker-compose up -d
```

5. Изпълнете миграциите на базата данни:

```bash
cd db/migrations
npm run migration:run
cd ../..
```

6. Проверете статуса:

```bash
docker-compose ps
```

## Достъп до услугите

- Frontend: http://localhost:3000
- Auth Service: http://localhost:3001
- User Service: http://localhost:3002
- Course Service: http://localhost:3003
- Test Service: http://localhost:3004
- Analytics Service: http://localhost:3005
- Ads Service: http://localhost:3006
- API Gateway: http://localhost:8080
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Разработка

### Локална разработка

```bash
# Стартирайте базата данни и Redis
docker-compose up -d db redis

# След това можете да стартирате микросервисите локално
cd services/auth
npm install
npm run start:dev
```

### Управление на миграциите на базата данни

```bash
# Навигирайте до директорията с миграциите
cd db/migrations

# Генериране на нова миграция
npm run migration:create -- ИмеНаМиграцията

# Изпълнение на миграциите
npm run migration:run

# Връщане на последната миграция
npm run migration:revert

# Показване на статуса на миграциите
npm run migration:show
```

Също можете да използвате помощния скрипт `manage-migrations.sh`:

```bash
# Показване на помощна информация
./db/scripts/manage-migrations.sh help

# Генериране на нова миграция
./db/scripts/manage-migrations.sh generate ИмеНаМиграцията

# Изпълнение на миграциите
./db/scripts/manage-migrations.sh run

# Връщане на последната миграция
./db/scripts/manage-migrations.sh revert
```

### Логове

```bash
# Преглед на логове на всички услуги
docker-compose logs -f

# Преглед на логове на конкретна услуга
docker-compose logs -f auth-service
```

## Структура на проекта

```
learning-platform/
├── services/          # Микросервиси
│   ├── auth/          # Автентикация и авторизация
│   ├── user/          # Управление на потребители
│   ├── course/        # Управление на курсове
│   ├── test/          # Управление на тестове
│   ├── analytics/     # Анализ на данни
│   ├── ads/           # Реклами
│   └── shared/        # Споделени компоненти
├── frontend/          # React приложение
├── nginx/             # Nginx конфигурация
├── db/                # Бази данни скриптове
│   ├── migrations/    # SQL миграции
│   ├── scripts/       # Помощни скриптове
│   └── optimization/  # SQL за оптимизация
└── docker-compose.yml # Docker оркестрация
```

## Допринос

1. Създайте fork на проекта
2. Създайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit на промените (`git commit -m 'Добави удивителна функция'`)
4. Push към branch (`git push origin feature/amazing-feature`)
5. Отворете Pull Request

## Лиценз

Този проект е лицензиран под MIT лиценз.

## Контакти

За въпроси и предложения: contact@yourdomain.com
