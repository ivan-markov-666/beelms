# QA Обучителна Платформа - Fullstack Architecture Document

## Introduction

Този документ описва пълната fullstack архитектура за QA Обучителната Платформа - интерактивна онлайн система за обучение в hobby мащаб, фокусирана върху Quality Assurance и тестване на софтуер. Платформата прилага **прогресивен достъп модел**, при който лекционното съдържание е свободно достъпно за всички посетители, докато разширените функции (тестове, проследяване на прогреса) изискват потребителска регистрация.

**Архитектурна Философия**: **Monorepo архитектура**, специално проектирана за разработка с AI асистенти. Основният инструмент за разработка ще бъде **WindSurf**, AI асистент за кодиране, който работи в тандем с разработчика. За визуалната част и UI компонентите ще се използва **Codux**.

### Starter Template or Existing Project

**Тип Проект**: Greenfield разработка - изграждане от нулата
**Подход**: Персонализирана разработка само с PostgreSQL
**Обосновка**: Уникалният прогресивен достъп модел и специализираните образователни функции изискват надеждно съхранение на данни и бързина на достъп, които PostgreSQL предоставят.

### Change Log

| Date       | Version | Description                   | Author              |
| ---------- | ------- | ----------------------------- | ------------------- |
| 2024-12-XX | 1.0     | Initial architecture document | Winston (Architect) |
| 2024-12-XX | 1.1     | BMad v4 restructuring         | Winston (Architect) |

## High Level Architecture

### Technical Summary

QA Обучителната Платформа използва **прагматична fullstack архитектура**, състояща се от **NestJS backend** и **две отделни React приложения** (управлявани като отделни приложения в обща monorepo структура) – едно за публичната част и едно за административния панел. Системата използва **само PostgreSQL** като основна база данни, което опростява инфраструктурата. Deployment-ът е насочен към **единична VPS среда**, но включва **задължителна стратегия за ежедневни автоматизирани бекъпи** на външна локация.

### Platform and Infrastructure Choice

**PostgreSQL-Only Platform Decision**:

**Предимства на PostgreSQL Подхода**:

- **Надеждност и стабилност**: PostgreSQL предлага ACID compliance и надеждно съхранение на данни
- **Производителност**: PostgreSQL осигурява бърз достъп до данни и реално време функционалност
- **Мащабируемост**: Лесно разширяемо решение с възможност за бъдещ растеж
- **Разширена функционалност**: PostgreSQL предлага разширени възможности за заявки и индексиране
- **Гъвкавост**: Поддръжка на сложни заявки и структури от данни

**Платформа**: VPS с Docker
**Ключови Услуги**:

- Nginx (reverse proxy & статично файлово обслужване)
- **PostgreSQL** (основна база данни)
- Docker Compose (опростена оркестрация)
- GitHub Actions (CI/CD)

**Deployment Host и Региони**: Единична VPS инстанция (Европейски регион за българската аудитория)

### High Level Project Diagram

```mermaid
graph TD
    subgraph "Достъп"
        User[Потребители] -->|yourdomain.com| LB[Nginx Reverse Proxy]
        Admin[Администратори] -->|yourdomain.com/admin| LB
    end

    subgraph "VPS Среда"
        LB -- / --> WebApp[Публично React Приложение (apps/web)]
        LB -- /admin --> AdminApp[Админ React Приложение (apps/admin)]
        LB --> API[NestJS Backend API]

        WebApp --> API
        AdminApp --> API
        API --> PostgresDB[(PostgreSQL Database)]
    end

    subgraph "Външни Услуги"
        API --> EmailService[SendGrid]
        API --> Sentry[Sentry]
    end

    User --> WebApp
    Admin --> AdminApp
```

### Architectural Patterns

- **Monorepo Pattern**: Единно Git repository с pnpm workspaces за управление на множество приложения
- **Relational Data Modeling**: Добре структурирани релационни модели в PostgreSQL
- **Stateless Authentication**: JWT tokens с access/refresh token flow
- **Progressive Access Model**: Публично съдържание с premium регистрирани функции
- **Full-Text Search Pattern**: PostgreSQL FTS за разширени възможности за търсене
- **Repository Pattern**: Абстракция на данните чрез TypeORM
- **Event-Driven Progress Tracking**: Фонови задачи за актуализация на потребителски прогрес

## Tech Stack

За детайли относно използваните технологии виж [docs/architecture/tech-stack.md](architecture/tech-stack.md).

## Source Tree

Актуална структура на сорс кода: [docs/architecture/source-tree.md](architecture/source-tree.md).

## Data Models

### User (Потребител)

**Предназначение**: Представлява регистрирани потребители в системата с minimal PII collection

**Ключови Атрибути**:

- id: UUID - Уникален идентификатор
- email: string - Email адрес на потребителя (уникален)
- passwordHash: string - bcrypt хеширана парола
- role: enum ('user', 'admin') - Default: 'user'
- isActive: boolean - Статус на активация на профила
- preferredLanguage: string - bg/en/de language preference

**Relationships**:

- One-to-many: UserProgress, TestAttempts, LearningPlanTopics, Bookmarks

### Category (Категория)

**Предназначение**: Организира теми в логически групи (QA Fundamentals, Automation, etc.)

**Ключови Атрибути**:

- id: UUID
- name: string (уникален)
- description: text
- colorCode: string (hex color)
- iconName: string (Material-UI icon)
- sortOrder: number

**Relationships**:

- One-to-many: Topics

### Topic (Тема/Лекция)

**Предназначение**: Индивидуални единици обучително съдържание

**Ключови Атрибути**:

- id: UUID
- categoryId: UUID (Foreign Key)
- topicNumber: number (sequential)
- name: string
- slug: string (URL-friendly)
- estimatedReadingTime: number (minutes)

**Relationships**:

- Many-to-one: Category
- One-to-many: TopicContent
- One-to-one: Test

### TopicContent (Многоезично Съдържание)

**Предназначение**: Езиково-специфично съдържание с PostgreSQL full-text search

**Ключови Атрибути**:

- topicId: UUID + languageCode: string (composite key)
- title: string (localized)
- content: text (rich text)
- searchVector: tsvector (PostgreSQL FTS)
- metaDescription: string

### Test & Question Models

**Test**:

- topicId: UUID (one-to-one with Topic)
- title: string
- passingPercentage: number (0-100)
- maxAttempts: number

**Question**:

- testId: UUID
- questionType: enum ('single', 'multiple')
- questionText: text
- explanation: text
- sortOrder: number (critical for sequential display)

## API Specification

### REST API Endpoints

| HTTP Method                | Endpoint                  | Description                              | Access Level    |
| :------------------------- | :------------------------ | :--------------------------------------- | :-------------- |
| **Authentication**         |
| `POST`                     | `/auth/register`          | Регистрация на нов потребител            | **Публичен**    |
| `POST`                     | `/auth/login`             | Вход на потребител и издаване на JWT     | **Публичен**    |
| `POST`                     | `/auth/refresh`           | Опресняване на access token              | **Публичен**    |
| `POST`                     | `/auth/logout`            | Излизане и изчистване на refresh token   | **Нужен Логин** |
| `GET`                      | `/auth/profile`           | Вземане на профила на текущия потребител | **Нужен Логин** |
| **Публично Съдържание**    |
| `GET`                      | `/categories`             | Списък с всички категории                | **Публичен**    |
| `GET`                      | `/courses`                | Списък с всички курсове (с филтри)       | **Публичен**    |
| `GET`                      | `/courses/:id`            | Детайли за конкретен курс                | **Публичен**    |
| `GET`                      | `/topics/:id`             | Съдържание на конкретна лекция           | **Публичен**    |
| **Потребителски Действия** |
| `GET`                      | `/users/me/progress`      | Агрегиран прогрес по курсове             | **Нужен Логин** |
| `POST`                     | `/topics/:id/complete`    | Маркиране на лекция като завършена       | **Нужен Логин** |
| `POST`                     | `/tests/:id/submit`       | Изпращане на отговори за тест            | **Нужен Логин** |
| `GET`                      | `/tests/results/:id`      | Преглед на резултати от тест             | **Нужен Логин** |
| **Администрация**          |
| `GET`                      | `/admin/users`            | Списък с всички потребители              | **Само Админ**  |
| `PUT`                      | `/admin/users/:id`        | Редакция на потребител                   | **Само Админ**  |
| `POST/PUT/DELETE`          | `/admin/categories(/:id)` | CRUD за категории                        | **Само Админ**  |
| `POST/PUT/DELETE`          | `/admin/topics(/:id)`     | CRUD за лекции                           | **Само Админ**  |
| `POST/PUT/DELETE`          | `/admin/tests(/:id)`      | CRUD за тестове                          | **Само Админ**  |
| `GET`                      | `/admin/dashboard/stats`  | Статистики за админ табло                | **Само Админ**  |
| `GET/PUT`                  | `/admin/settings`         | Системни настройки                       | **Само Админ**  |

### Authentication Flow

**Access + Refresh Token Pattern**:

1. **Login**: Връща `access_token` в response body + `refresh_token` в httpOnly cookie
2. **API Requests**: `Authorization: Bearer <access_token>` header
3. **Token Refresh**: При 401 error, автоматично refresh чрез `/auth/refresh`
4. **Logout**: Изчистване на httpOnly cookie + памет на frontend

## Components

### Backend Components

**NestJS Backend API**

- **Responsibility**: Централизирано API за всички операции
- **Key Interfaces**: REST endpoints, Authentication guards, Database ORM
- **Dependencies**: PostgreSQL, SendGrid, Sentry
- **Technology Stack**: NestJS, TypeORM, JWT, bcrypt

### Frontend Components

**Публично React Приложение (apps/web)**

- **Responsibility**: Потребителски интерфейс за курсове и регистрация
- **Key Interfaces**: Public routes, User dashboard, Course viewer
- **Dependencies**: Shared UI components, API client
- **Technology Stack**: React, Mantine UI, Zustand

**Административно React Приложение (apps/admin)**

- **Responsibility**: Административен панел за управление на съдържание
- **Key Interfaces**: CRUD forms, User management, System settings
- **Dependencies**: Shared UI components, Admin API client
- **Technology Stack**: React, Mantine UI, Zustand

**Споделени Пакети**:

- **packages/shared-types**: TypeScript интерфейси
- **packages/ui-components**: Реusable React компоненти
- **packages/constants**: API routes и константи

## External APIs

### SendGrid Email API

- **Purpose**: Изпращане на системни имейли (регистрация, reset password)
- **Documentation**: https://docs.sendgrid.com/api-reference
- **Base URL**: https://api.sendgrid.com/v3
- **Authentication**: API Key в Authorization header
- **Rate Limits**: 100 emails/day (free plan)

**Key Endpoints Used**:

- `POST /mail/send` - Изпращане на имейл

**Integration Notes**:

- Дневен брояч в database за лимит управление
- Graceful fallback при достигнат лимит
- Конфигурируем лимит в admin панел

### Email Service Resilience Strategy

**Primary Provider**: SendGrid (100 emails/day free tier)
**Backup Strategy**:

- **Critical Emails** (password reset, account activation): Queue for retry with exponential backoff
- **Rate Limit Management**: Database counter with soft limit at 90 emails/day
- **Fallback Options**:
  - Admin notification when approaching daily limit
  - Manual email sending capability through admin panel
  - Local SMTP configuration for development/emergency use

**Email Priority Classification**:

- **High Priority**: Password reset, account activation (require immediate delivery)
- **Medium Priority**: Course completion notifications (can be delayed)
- **Low Priority**: Marketing/newsletter emails (can be deferred)

### Sentry Error Tracking

- **Purpose**: Error tracking и performance monitoring
- **Base URL**: Sentry project DSN
- **Integration**: SDK integration в NestJS и React
- **Rate Limits**: Щедър безплатен план

## Core Workflows

### User Registration and Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant DB as PostgreSQL
    participant E as SendGrid

    U->>F: Register (email, password)
    F->>A: POST /auth/register
    A->>DB: Create user (inactive)
    A->>E: Send activation email
    A->>F: 201 Created
    F->>U: Check your email

    U->>F: Login (email, password)
    F->>A: POST /auth/login
    A->>DB: Validate credentials
    A->>F: access_token + httpOnly refresh_token
    F->>U: Redirect to dashboard
```

### Topic Completion and Progress Tracking

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant DB as PostgreSQL
    participant BJ as Background Job

    U->>F: Complete topic
    F->>A: POST /topics/:id/complete
    A->>DB: Create/update UserProgress
    A->>BJ: Queue progress calculation job
    A->>F: 200 OK (optimistic UI)
    F->>U: Show completed state

    BJ->>DB: Calculate course progress
    BJ->>DB: Update UserCourseProgress
```

## Database Schema

### PostgreSQL Schema Definition

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT FALSE,
    preferred_language VARCHAR(2) DEFAULT 'bg' CHECK (preferred_language IN ('bg', 'en', 'de')),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color_code VARCHAR(7) DEFAULT '#1976d2',
    icon_name VARCHAR(50) DEFAULT 'book',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Topics table
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    topic_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    estimated_reading_time INTEGER DEFAULT 5,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, topic_number)
);

-- Topic content with multi-language support and FTS
CREATE TABLE topic_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    language_code VARCHAR(2) NOT NULL DEFAULT 'bg' CHECK (language_code IN ('bg', 'en', 'de')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    meta_description TEXT,
    search_vector TSVECTOR, -- For full-text search
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_id, language_code)
);

-- GIN index for full-text search
CREATE INDEX idx_topic_content_search ON topic_content USING GIN(search_vector);

-- Tests with sequential questions
CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    passing_percentage INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(topic_id)
);

-- User progress tracking
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    completion_percentage INTEGER DEFAULT 0,
    manually_completed BOOLEAN DEFAULT FALSE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, topic_id)
);
```

## Frontend Architecture

### Component Architecture

**Component Organization**:

```
apps/web/src/
├── components/
│   ├── common/          # Shared components
│   ├── course/          # Course-related components
│   ├── auth/            # Authentication components
│   └── layout/          # Layout components
├── pages/               # Page components/routes
├── hooks/               # Custom React hooks
├── services/            # API client services
├── stores/              # Zustand state stores
└── utils/               # Frontend utilities
```

**Component Template**:

```typescript
import React from 'react';
import { Button } from '@mantine/core';

interface ComponentProps {
  title: string;
  onClick?: () => void;
}

export const Component: React.FC<ComponentProps> = ({ title, onClick }) => {
  return (
    <Button onClick={onClick}>
      {title}
    </Button>
  );
};
```

### Accessibility Requirements

**WCAG Compliance Target**: WCAG 2.1 AA Level
**Accessibility Framework**: Mantine UI built-in accessibility + custom enhancements

**Key Requirements**:

- **Keyboard Navigation**: Пълна keyboard accessibility за всички интерактивни елементи
- **Screen Reader Support**: Proper ARIA labels и semantic HTML structure
- **Color Contrast**: Минимум 4.5:1 contrast ratio за normal text, 3:1 за large text
- **Focus Management**: Visible focus indicators и logical tab order
- **Alternative Text**: Задължителни alt attributes за всички изображения

**Testing Strategy**:

- **Automated Testing**: axe-core integration в component tests
- **Manual Testing**: Quarterly keyboard navigation и screen reader testing
- **Tools**:
  - Browser: axe DevTools extension
  - Testing: @axe-core/react за автоматизирани проверки
  - Screen Reader: NVDA за Windows testing

**Implementation**:

```typescript
// Пример за accessibility-first компонент
export const AccessibleButton: React.FC<ButtonProps> = ({
  children,
  onClick,
  'aria-label': ariaLabel,
  disabled = false
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || children?.toString()}
      sx={{ '&:focus': { outline: '2px solid #1976d2' } }}
    >
      {children}
    </Button>
  );
};
```

### State Management Architecture

**State Structure**:

```typescript
// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// Courses Store
interface CoursesState {
  courses: Course[];
  selectedCourse: Course | null;
  userProgress: UserProgress[];
  fetchCourses: () => Promise<void>;
  selectCourse: (id: string) => void;
}
```

### Responsive Design Strategy

**Breakpoints (Mantine UI стандарт)**:
| Breakpoint | Min Width | Target Devices | Usage |
|------------|-----------|----------------|--------|
| `xs` | 576px | Mobile phones | Single column layouts |
| `sm` | 768px | Tablets (portrait) | Simplified navigation |
| `md` | 992px | Tablets (landscape) | Grid layouts начинаят |
| `lg` | 1200px | Desktop | Full feature set |
| `xl` | 1400px | Large desktop | Optimized spacing |

**Mobile-First Approach**:

- **Design Philosophy**: Progressive enhancement от mobile към desktop
- **Touch Targets**: Минимум 44px × 44px за touch elements
- **Navigation**: Collapsible navigation за mobile, full navigation за desktop
- **Content Priority**: Essential content visible без horizontal scroll на mobile

**Responsive Patterns**:

```typescript
// Responsive layout component
const ResponsiveLayout: React.FC = ({ children }) => {
  return (
    <Container size="xl">
      <Grid>
        <Grid.Col span={{ base: 12, md: 8, lg: 9 }}>
          <main>{children}</main>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4, lg: 3 }}>
          <aside>Sidebar съдържание</aside>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

// Responsive text sizing
const useResponsiveText = () => {
  const theme = useMantineTheme();
  return {
    title: { fontSize: '2rem', [theme.fn.smallerThan('md')]: { fontSize: '1.5rem' } },
    body: { fontSize: '1rem', [theme.fn.smallerThan('sm')]: { fontSize: '0.9rem' } },
  };
};
```

**Platform-Specific Considerations**:

- **Admin Panel**: Desktop-first design (предполага desktop usage)
- **Public Site**: Mobile-first design (достъпност за всички потребители)
- **Progressive Web App**: Service worker за offline functionality (future consideration)

### UX State Management Patterns

**Loading States**:

```typescript
interface UIState {
  isLoading: boolean;
  loadingMessage?: string;
  error: string | null;
  success: string | null;
}

// Loading patterns
const LoadingStates = {
  INITIAL: 'Зареждане...',
  SAVING: 'Записване на промените...',
  DELETING: 'Изтриване...',
  UPLOADING: 'Качване на файл...',
} as const;
```

**Error Handling UX**:

- **Toast Notifications**: Mantine Notifications за временни съобщения
- **Inline Errors**: Form field-specific грешки
- **Page-Level Errors**: Error boundaries за critical failures
- **Network Errors**: Automatic retry з visual feedback

**Success Feedback**:

- **Immediate Feedback**: Button state changes (loading → success)
- **Confirmation Messages**: Toast notifications за successful actions
- **Visual Cues**: Progress bars за multi-step processes
- **Optimistic Updates**: Immediate UI updates с rollback при грешка

**Implementation Example**:

```typescript
const useApiCall = <T>(apiFunction: () => Promise<T>) => {
  const [state, setState] = useState<UIState>({
    isLoading: false,
    error: null,
    success: null,
  });

  const execute = async () => {
    setState({ isLoading: true, error: null, success: null });
    try {
      const result = await apiFunction();
      setState({ isLoading: false, error: null, success: 'Успешно!' });
      return result;
    } catch (error) {
      setState({
        isLoading: false,
        error: 'Възникна грешка. Моля, опитайте отново.',
        success: null,
      });
    }
  };

  return { ...state, execute };
};
```

### Routing Architecture

**Route Organization**:

```
/ - Homepage
/courses - All courses listing
/courses/:id - Course details
/topics/:id - Topic content
/register - User registration
/login - User login
/dashboard - User dashboard (protected)
/profile - User profile (protected)
/test/:id - Test interface (protected)
/admin/* - Admin routes (admin only)
```

### Frontend Services Layer

**API Client Setup**:

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // For httpOnly cookies
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await useAuthStore.getState().refreshToken();
        return apiClient.request(error.config);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);
```

## Backend Architecture

### Service Architecture

**NestJS Service Organization**:

```
src/
├── auth/                # Authentication module
├── users/               # User management
├── categories/          # Category CRUD
├── topics/              # Topic management
├── tests/               # Test system
├── admin/               # Admin-specific services
├── common/              # Shared utilities
└── database/            # Database config & migrations
```

### Database Architecture

**Schema Design**: PostgreSQL-focused релационна схема с оптимизации за:

- Full-text search с tsvector индекси
- Efficient user progress tracking
- Multi-language content support
- Audit trails за административни действия

**Data Access Layer**:

```typescript
@Injectable()
export class TopicService {
  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>
  ) {}

  async findWithContent(id: string, lang: string): Promise<Topic> {
    return this.topicRepository
      .createQueryBuilder('topic')
      .leftJoinAndSelect('topic.content', 'content', 'content.languageCode = :lang', { lang })
      .where('topic.id = :id', { id })
      .getOne();
  }
}
```

### Authentication and Authorization

**Auth Flow**:

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Service
    participant J as JWT Service
    participant D as Database

    C->>A: Login request
    A->>D: Validate credentials
    D->>A: User data
    A->>J: Generate tokens
    J->>A: access_token + refresh_token
    A->>C: access_token + httpOnly cookie
```

**Authorization Guards**:

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some((role) => user.role === role);
  }
}
```

## Unified Project Structure

Подробна информация за структурата на проекта се поддържа в отделния документ [docs/architecture/source-tree.md](architecture/source-tree.md).

## Development Workflow

### Local Development Setup

**Prerequisites**:

```bash
# Install Node.js 18+
node --version  # Should be 18+

# Install pnpm
npm install -g pnpm

# Install PostgreSQL 15+
psql --version  # Should be 15+
```

**Initial Setup**:

```bash
# Clone repository
git clone <repository-url>
cd qa-platform

# Install all dependencies
pnpm install

# Setup environment variables
cp .env.example .env
# Edit .env with your local settings

# Setup database
createdb qa_platform_dev
pnpm run migrate

# Seed initial data
pnpm run seed
```

### Email Testing in Development

**Local Development Email Setup**:

```bash
# Development Environment Variables
NODE_ENV=development
EMAIL_PROVIDER=console  # Options: sendgrid, console, smtp
SENDGRID_API_KEY=       # Leave empty for console mode

# For local SMTP testing (optional)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
```

**Email Testing Approaches**:

1. **Console Mode** (default): Emails logged to console with full content
2. **MailHog/MailCatcher**: Local email capture for UI testing
3. **SendGrid Sandbox**: Test mode that doesn't send real emails

**Email Templates Testing**:

- Admin panel preview functionality for all email templates
- Test email sending to administrator accounts only

**Development Commands**:

```bash
# Start all services in development
pnpm dev

# Start individual services
pnpm --filter backend dev    # Backend only
pnpm --filter web dev        # Web app only
pnpm --filter admin dev      # Admin app only

# Run tests
pnpm test                    # All tests
pnpm test:backend           # Backend tests only
pnpm test:web               # Web app tests only
```

### Recommended Development Sequence

**Phase 1: Foundation Infrastructure (Epic 1 - Weeks 1-2)**

1. **Monorepo Setup**: Initialize pnpm workspace с shared packages structure
2. **Database Foundation**: PostgreSQL schema, migrations, basic CRUD operations
3. **Backend Core**: NestJS setup, authentication module, basic API endpoints
4. **Frontend Foundation**: React apps setup, routing, shared components
5. **Development Tooling**: ESLint, Prettier, testing framework setup

**Phase 2: Core User Features (Epic 2 - Weeks 3-4)**

1. **Authentication Flow**: User registration, login, JWT token management
2. **Public Content**: Categories и topics viewing без authentication
3. **Content Management**: Basic CRUD в admin panel за categories/topics
4. **Email Integration**: SendGrid setup за registration emails

**Phase 3: Interactive Learning (Epic 3 - Weeks 5-6)**

1. **User Progress**: Topic completion tracking, progress visualization
2. **Test System**: Question/answer functionality, test results
3. **User Dashboard**: Personal progress, completed courses overview
4. **Advanced Admin**: User management, system statistics

**Phase 4: Production Readiness (Epic 4 - Week 7)**

1. **Performance Optimization**: Query optimization, caching, bundle optimization
2. **Monitoring Integration**: Sentry setup, error tracking, performance monitoring
3. **Deployment Pipeline**: CI/CD setup, Docker containerization
4. **Security Hardening**: Rate limiting, input validation, security headers

**Critical Dependencies per Phase**:

- **Phase 1 → Phase 2**: Database schema + Authentication system
- **Phase 2 → Phase 3**: User management + Content structure
- **Phase 3 → Phase 4**: Core functionality + Test coverage

### Environment Configuration

**Required Environment Variables**:

```bash
# Frontend (.env.local)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_APP_NAME="QA Platform"

# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/qa_platform_dev
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
SENDGRID_API_KEY=your-sendgrid-api-key
SENTRY_DSN=your-sentry-dsn
PORT=3001
NODE_ENV=development

# Shared
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment**:

- **Platform**: Nginx static file serving
- **Build Command**: `pnpm build`
- **Output Directory**: `dist/`
- **CDN/Edge**: CloudFlare or similar

**Backend Deployment**:

- **Platform**: Docker container на VPS
- **Build Command**: `pnpm build`
- **Deployment Method**: Docker Compose

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:regression

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        run: |
          # Build Docker images
          # Upload to VPS
          # Run deployment script
```

### Deployment Approval Process

**Automated Deployment Flow**:

- **Development**: Fully automated при push към `develop` branch
- **Staging**: Fully automated при push към `main` branch
- **Production**: Automated build + manual approval gate

**Human Oversight Requirements**:

- **Production Deployments**: Mandatory human approval преди deployment
- **Database Migrations**: Human review на migration scripts преди production
- **Environment Variables**: Human verification на production config changes
- **Rollback Decisions**: Human-initiated, agent-executed rollback procedures

**Monitoring and Verification**:

- **Post-Deployment**: Human oversight на deployment success metrics за 15 минути
- **Health Checks**: Automated health check със human notification при failures
- **Performance Impact**: Human review на post-deployment performance metrics

**Emergency Procedures**:

- **Immediate Rollback**: Human authorization + automated execution
- **Hotfix Deployment**: Expedited approval process за critical fixes
- **Service Degradation**: Human escalation при automated alerts

### Environments

| Environment | Frontend URL                    | Backend URL                         | Purpose                |
| ----------- | ------------------------------- | ----------------------------------- | ---------------------- |
| Development | http://localhost:3000           | http://localhost:3001               | Local development      |
| Staging     | https://staging.qa-platform.com | https://api-staging.qa-platform.com | Pre-production testing |
| Production  | https://qa-platform.com         | https://api.qa-platform.com         | Live environment       |

## Security and Performance

### Security Requirements

**Frontend Security**:

- CSP Headers: Строги Content Security Policy rules
- XSS Prevention: Санитизация на всички user inputs
- Secure Storage: Access tokens в памет, refresh tokens в httpOnly cookies

**Backend Security**:

- Input Validation: Всички входящи данни валидирани с class-validator
- Rate Limiting: nestjs-throttler за protection от brute force
- CORS Policy: Ограничени origins в production

**Authentication Security**:

- Token Storage: JWT access tokens в памет, refresh tokens в httpOnly cookies
- Session Management: Stateless JWT approach с token rotation
- Password Policy: bcrypt hashing с appropriate cost factor

### Performance Optimization

**Frontend Performance**:

- Bundle Size Target: < 500KB gzipped
- Loading Strategy: Code splitting и lazy loading
- Caching Strategy: Service Worker за static assets

**Backend Performance**:

- Response Time Target: < 200ms за API calls
- Database Optimization: Правилни индекси и query optimization
- Caching Strategy: In-memory caching за frequently accessed data

### Dependency Risk Assessment & Mitigation

**Critical Path Dependencies**:

**1. PostgreSQL Database Stability**

- **Risk**: Database corruption или connection issues
- **Impact**: Пълен system failure
- **Mitigation**:
  - Daily automated backups с external storage
  - Connection pooling с retry logic
  - Health check endpoints за database connectivity

**2. Authentication System Integrity**

- **Risk**: JWT security vulnerabilities или token management issues
- **Impact**: Security breach или user lockout
- **Mitigation**:
  - Token rotation strategy
  - Secure token storage (httpOnly cookies)
  - Rate limiting на authentication endpoints

**3. Shared Types Consistency**

- **Risk**: Type mismatches между frontend и backend
- **Impact**: Runtime errors, API communication failures
- **Mitigation**:
  - Automated type generation от backend schemas
  - Strict TypeScript configuration
  - Integration tests за API contracts

**External Service Risks**:

**4. SendGrid Email Service**

- **Risk**: API rate limits (100 emails/day) или service downtime
- **Impact**: Blocked user registration
- **Mitigation**:
  - Email queue с retry mechanism
  - Admin notification при approaching limits
  - Alternative email delivery для critical emails

**5. Sentry Monitoring Service**

- **Risk**: Service outage или quota exceeded
- **Impact**: Loss of error tracking (не блокира core functionality)
- **Mitigation**:
  - Local logging като fallback
  - Error aggregation в database
  - Non-blocking error reporting

**Development Dependencies**:

**6. Monorepo Package Dependencies**

- **Risk**: Version conflicts между packages
- **Impact**: Build failures, runtime inconsistencies
- **Mitigation**:
  - Strict version pinning в package.json
  - Automated dependency updates с testing
  - Workspace dependency resolution via pnpm

## Testing Strategy

### Testing Pyramid

```
              E2E Tests (Playwright)
             /                    \
        Integration Tests (Testcontainers)
           /                            \
    Frontend Unit Tests (Vitest)  Backend Unit Tests (Jest)
```

### Test Organization

**Frontend Tests**:

```
apps/web/tests/
├── unit/
│   ├── components/     # Component unit tests
│   └── hooks/          # Custom hooks tests
├── integration/
│   └── api/            # API integration tests
└── e2e/
    └── user-flows/     # End-to-end user scenarios
```

**Backend Tests**:

```
apps/api/tests/
├── unit/
│   ├── services/       # Service unit tests
│   └── controllers/    # Controller unit tests
├── integration/
│   └── endpoints/      # API endpoint tests
└── e2e/
    └── workflows/      # Complete workflow tests
```

**E2E Tests**:

```
tests/e2e/
├── auth/               # Authentication flows
├── courses/            # Course management
└── admin/              # Admin functionality
```

### Test Examples

**Frontend Component Test**:

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@qa-platform/ui-components';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
});
```

**Backend API Test**:

```typescript
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { testContainers } from './test-containers';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    await testContainers.start();
    // Setup test app
  });

  it('/auth/login (POST)', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200)
      .expect((res) => {
        expect(res.body.access_token).toBeDefined();
      });
  });
});
```

**E2E Test**:

```typescript
import { test, expect } from '@playwright/test';

test('user can complete a topic', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'user@example.com');
  await page.fill('[data-testid=password]', 'password123');
  await page.click('[data-testid=login-button]');

  await page.goto('/topics/intro-to-qa');
  await page.click('[data-testid=complete-topic]');

  await expect(page.locator('[data-testid=completion-badge]')).toBeVisible();
});
```

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing**: Всички типове се дефинират в `packages/shared-types` и се импортират от там
- **API Calls**: Никога директни HTTP calls - използвай service layer
- **Environment Variables**: Достъп само чрез config objects, никога `process.env` директно
- **Error Handling**: Всички API routes използват стандартния error handler
- **State Updates**: Никога мутация на state директно - използвай Zustand patterns

### Naming Conventions

| Element         | Frontend             | Backend    | Example             |
| --------------- | -------------------- | ---------- | ------------------- |
| Components      | PascalCase           | -          | `UserProfile.tsx`   |
| Hooks           | camelCase with 'use' | -          | `useAuth.ts`        |
| API Routes      | -                    | kebab-case | `/api/user-profile` |
| Database Tables | -                    | snake_case | `user_profiles`     |
| Services        | PascalCase           | PascalCase | `UserService`       |
| Interfaces      | PascalCase           | PascalCase | `CreateUserDto`     |

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Axios Interceptor
    participant API as Backend API
    participant E as Error Handler

    C->>API: API Request
    API->>E: Throws error
    E->>API: Formatted error response
    API->>A: HTTP error response
    A->>C: User-friendly message
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling

```typescript
// Axios interceptor for centralized error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      return handleUnauthorized();
    }
    if (error.response?.status === 429) {
      // Handle rate limiting
      showNotification('Моля, опитайте отново по-късно');
    }
    if (error.response?.status >= 500) {
      // Handle server errors
      showNotification('Възникна техническа грешка');
    }
    return Promise.reject(error);
  }
);
```

### Backend Error Handling

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    const errorResponse = {
      error: {
        code: this.getErrorCode(exception),
        message: this.getErrorMessage(exception),
        timestamp: new Date().toISOString(),
        requestId: request.headers['x-request-id'],
      },
    };

    response.status(status).json(errorResponse);
  }
}
```

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring**: Sentry за error tracking и performance monitoring
- **Backend Monitoring**: Sentry + structured logging с pino
- **Database Monitoring**: PostgreSQL query performance metrics
- **Infrastructure Monitoring**: VPS resource utilization

### Key Metrics

**PostgreSQL Metrics**:

- Query performance (>100ms threshold)
- Connection pool utilization
- Cache hit ratio
- Replication lag (if applicable)
- Deadlocks and long-running transactions

**Application Metrics**:

- Request rates per endpoint
- Authentication success/failure rates
- API response times
- Error rates by type
- Cache hit/miss ratios

**User Experience Metrics**:

- Core Web Vitals
- Page load times
- Time to interactive
- User session duration
- Course completion rates

### Backup and Recovery Strategy

**Automated Backups**:

- Ежедневни PostgreSQL backups с `pg_dump`
- Encryption с `gpg` преди upload
- External storage с `rclone` (Google Drive/Backblaze)
- Automated backup verification

**Recovery Procedures**:

- Documented step-by-step recovery процес
- Quarterly backup restore testing
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 24 hours
