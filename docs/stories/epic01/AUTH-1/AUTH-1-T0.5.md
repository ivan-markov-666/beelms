# AUTH-1-T8: Настройка на Docker среда

## Описание
Създаване на Docker базирана среда за разработка и тестване на функционалността за автентикация.

## Компоненти

### 1. Услуги
- **PostgreSQL 15**
  - Версия: 15-alpine
  - Порт: 5432
  - Променливи на средата:
    ```
    POSTGRES_USER=lms
    POSTGRES_PASSWORD=lms123
    POSTGRES_DB=lms_dev
    ```
  - Том за данни: `postgres_data`
  - Health check

- **Redis 7**
  - Версия: 7-alpine
  - Порт: 6379
  - Том за данни: `redis_data`
  - Health check

- **MailHog** (SMTP сървър за разработка)
  - Порт: 1025 (SMTP), 8025 (Web UI)
  - Health check

### 2. Docker Compose конфигурация
Файл: `docker-compose.yml`
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    container_name: lms_db
    environment:
      POSTGRES_USER: ${DB_USER:-lms}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-lms123}
      POSTGRES_DB: ${DB_NAME:-lms_dev}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init-db:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-lms} -d ${DB_NAME:-lms_dev}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: lms_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog:latest
    container_name: lms_mailhog
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:8025"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### 3. Скриптове за инициализация
Файл: `docker/init-db/01-init.sql`
```sql
-- Създаване на схеми
CREATE SCHEMA IF NOT EXISTS auth;

-- Създаване на enum типове
CREATE TYPE user_status AS ENUM ('pending', 'active', 'suspended', 'deleted');

-- Таблици (ще бъдат създадени от миграциите)
-- Тук могат да се добавят само статични данни
```

## Настройки на приложението
Файл: `.env.development`
```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=lms
DB_PASSWORD=lms123
DB_NAME=lms_dev

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email (MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="LMS Dev <noreply@example.com>"
```

## Документация за употреба

### Стартиране на средата
```bash
# Създаване и стартиране на контейнерите
docker-compose up -d

# Спиране на средата
docker-compose down

# Преглед на логове
docker-compose logs -f
```

### Доставчици на поща
- **MailHog**: http://localhost:8025
- **pgAdmin**: http://localhost:5050 (ако е добавен)

## Критерии за приемане
- [ ] Всички контейнери стартират успешно
- [ ] Базата данни е достъпна от приложението
- [ ] Redis е достъпен от приложението
- [ ] MailHog получава имейли
- [ ] Health checks са конфигурирани и работят
- [ ] Добавена е документация в README.md

## Зависимости
- [AUTH-1-T0](AUTH-1-T0.md)

## Свързани файлове
- `docker-compose.yml`
- `docker/init-db/01-init.sql`
- `.env.development`
- `README.md`

## Бележки
- Тази конфигурация е предназначена само за разработка
- Не използвайте тези настройки за производствена среда
- Паролите трябва да се съхраняват сигурно в production
