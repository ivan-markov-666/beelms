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

## Тестване на средата и базата данни

### Тестване на средата за разработка

Преди да стартирате системата, можете да изпълните автоматизиран тест на средата, за да проверите дали всичко е правилно настроено:

```bash
# В PowerShell на Windows
.\test-environment.ps1

# В Linux с PowerShell Core
./test-environment.ps1
```

### Тестване на миграциите на базата данни

Можете да стартирате тестовете на миграциите на базата данни, за да проверите дали те работят правилно:

```bash
# Навигирайте до директорията с миграциите
cd db/migrations

# Изпълнете тестовете с npm
npm test

# Или използвайте специализирания скрипт за директно тестване
cd ../..  # връщане в основната директория
./db/scripts/run-migrations-tests.sh

# За тестване в изолирана Docker среда
./db/scripts/run-docker-tests.sh

# Можете също да тествате само връзката и зареждането на миграциите:
cd db/migrations
npx ts-node tests/db-migration-connection-test.ts
```

За подробности относно всички тестове, моля, вижте [TESTS.md](TESTS.md).

## Бърз старт

1. Клонирайте хранилището:

```bash
git clone <repository-url>
cd learning-platform
```

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
