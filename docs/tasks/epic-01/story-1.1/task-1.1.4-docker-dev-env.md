# Task 1.1.4: Docker Development Environment

## 🎯 Цел

Създаване на пълна development среда с Docker, която включва всички необходими сървиси за разработката.

## 🛠️ Компоненти

- PostgreSQL база данни с pgAdmin за управление
- Backend API сървис (NestJS)
- Публично уеб приложение (React)
- Административно уеб приложение (React)

## 📋 Docker Compose конфигурация

### docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-qa_platform_dev}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-postgres}']
      interval: 5s
      timeout: 5s
      retries: 5

  # pgAdmin
  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: ${PGADMIN_DEFAULT_EMAIL:-admin@example.com}
      PGADMIN_DEFAULT_PASSWORD: ${PGADMIN_DEFAULT_PASSWORD:-admin}
    ports:
      - '5050:80'
    depends_on:
      - postgres

  # API Service
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
      target: development
    command: pnpm run start:dev
    ports:
      - '3000:3000'
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-postgres}@postgres:5432/${POSTGRES_DB:-qa_platform_dev}
    depends_on:
      postgres:
        condition: service_healthy

  # Web Application
  web:
    build:
      context: .
      dockerfile: Dockerfile.web
      target: development
    ports:
      - '3001:3000'
    volumes:
      - ./apps/web:/app/apps/web
      - /app/node_modules
    environment:
      NODE_ENV: development
      REACT_APP_API_URL: http://localhost:3000
    depends_on:
      - api

  # Admin Application
  admin:
    build:
      context: .
      dockerfile: Dockerfile.admin
      target: development
    ports:
      - '3002:3000'
    volumes:
      - ./apps/admin:/app/apps/admin
      - /app/node_modules
    environment:
      NODE_ENV: development
      REACT_APP_API_URL: http://localhost:3000
    depends_on:
      - api

volumes:
  postgres_data:
```

### Dockerfile.dev

```dockerfile
# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/constants/package.json ./packages/constants/

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm --filter @qa-platform/api build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["pnpm", "--filter", "api", "run", "start:dev"]
```

## 📦 Deliverables

- [x] `docker-compose.yml` файл с всички необходими сървиси
- [x] `Dockerfile.dev` за development среда
- [ ] Документация за стартиране и използване
- [ ] Скриптове за управление на средата

## 🚀 Стартиране на средата

```bash
# Копиране на .env.example към .env
cp .env.example .env

# Стартиране на всички сървиси
docker-compose up -d

# Спиране на средата
docker-compose down

# Преглед на логове
docker-compose logs -f
```

## 🔧 Често срещани проблеми

1. **Липсващи променливи на средата**
   - Уверете се, че всички необходими променливи са дефинирани във файл `.env`

2. **Проблеми с правата**
   - За Windows/WSL2: добавете `COMPOSE_CONVERT_WINDOWS_PATHS=1` в .env файла

3. **Проблеми с hot reload**
   - За Windows/WSL2: добавете `CHOKIDAR_USEPOLLING=true` в environment променливите

4. **Проблеми с pnpm**
   - При грешки с pnpm, изтрийте node_modules и изпълнете: `pnpm store prune && pnpm install`

## 🧪 Тестване и Валидиране

### Верификационни Точки

1. **Проверка на контейнерите**

   ```bash
   # Проверка дали всички контейнери са стартирани
   docker-compose ps
   ```

   Очакван изход: Всички услуги трябва да са в състояние "Up"

2. **Проверка на логите**

   ```bash
   # Преглед на логите на всички услуги
   docker-compose logs

   # Следене на логите в реално време
   docker-compose logs -f
   ```

   Очакван резултат: Липса на грешки в логовете

3. **Валидиране на PostgreSQL**

   ```bash
   # Проверка на връзката с базата данни
   docker-compose exec postgres pg_isready -U postgres

   # Вход в базата данни
   docker-compose exec postgres psql -U postgres -d qa_platform_dev -c "\l"
   ```

   Очакван резултат: Списък с базите данни, включително `qa_platform_dev`

4. **Валидиране на API сървиса**

   ```bash
   # Проверка на здравословното състояние на API-то
   curl -v http://localhost:3000/health
   ```

   Очакван резултат: HTTP 200 OK с информация за здравословното състояние

5. **Валидиране на уеб приложенията**
   - Отворете в браузър:
     - Публично приложение: http://localhost:3001
     - Административно приложение: http://localhost:3002
       Очакван резултат: Уеб приложенията се зареждат без грешки в конзолата

### Автоматизиран Smoke Test

Създайте файл `scripts/test-docker-env.sh` със следното съдържание:

```bash
#!/bin/bash
set -e
echo "🚀 Старт на валидирането на Docker средата..."

# Проверка на работещите контейнери
echo "🔍 Проверка на контейнерите..."
if ! docker-compose ps | grep -q "Up"; then
  echo "❌ Грешка: Не всички контейнери са стартирани"
  exit 1
fi

# Проверка на PostgreSQL
echo "🛢️  Проверка на връзката с PostgreSQL..."
if ! docker-compose exec -T postgres pg_isready -U postgres; then
  echo "❌ Грешка: Неуспешна връзка с PostgreSQL"
  exit 1
fi

# Проверка на API сървиса
echo "🌐 Проверка на API сървиса..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || true)
if [ "$API_STATUS" != "200" ]; then
  echo "❌ Грешка: API сървисът не отговаря (Очаква се 200, получен $API_STATUS)"
  exit 1
fi

echo "✅ Всички проверки преминаха успешно!"
echo "   - Публично приложение: http://localhost:3001"
echo "   - Административно приложение: http://localhost:3002"
echo "   - pgAdmin: http://localhost:5050"
```

Направете скрипта изпълним:

```bash
chmod +x scripts/test-docker-env.sh
```

### Regression Test Suite

1. **Структура на тестовете**:
   - Всички тестове се намират в директорията `/tests`
   - Документация за всички тестове се поддържа в коренния `TESTS.md` файл

2. **Добавяне на тестове в package.json**:
   Добавете следните скриптове в `package.json`:

   ```json
   "scripts": {
     "test:smoke": "sh ./tests/smoke/health-check.sh",
     "test:regression": "pnpm test:smoke && pnpm test:regression:api && pnpm test:regression:e2e",
     "test:regression:api": "echo 'Running API tests...'",
     "test:regression:e2e": "echo 'Running E2E tests...'"
   }
   ```

3. **Изпълнение на тестове**:

   ```bash
   # Стартиране само на smoke тестовете
   pnpm test:smoke

   # Стартиране на всички regression тестове
   pnpm test:regression

   # Стартиране на конкретна група тестове
   pnpm test:regression:api
   pnpm test:regression:e2e
   ```

### Документация на тестовете

1. **Формат на документацията**:
   - Всеки тест или група тестове трябва да бъде документиран в `TESTS.md`
   - Документацията трябва да включва:
     - Кратко описание на теста
     - Как се изпълнява
     - Очаквани резултати
     - Възможни проблеми и решения

2. **Примерна структура за нов тест**:
   ```markdown
   ## [Име на теста]

   - **Файл**: [път до тестовия файл]
   - **Цел**: [какво тества]
   - **Как се изпълнява**: [команда]
   - **Очакван резултат**: [описание]
   ```

### Интеграция с CI/CD

Добавете следните стъпки във вашия CI/CD workflow:

```yaml
- name: Setup Docker Environment
  run: docker-compose up -d

- name: Run Smoke Tests
  run: pnpm test:smoke

- name: Run Regression Tests
  if: success()
  run: pnpm test:regression
```

## 📝 Бележки

- Уверете се, че Docker Desktop е инсталиран и работи
- Проверете дали всички портове са свободни преди стартиране
- Документирайте всички необходими променливи на средата в `.env.example`
