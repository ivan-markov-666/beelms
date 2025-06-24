# Единна структура на проекта

Този документ описва организацията на файловете и директориите в проекта, както и конвенциите за именуване, които трябва да се следват от всички разработчици.

## Съдържание
1. [Общ преглед](#общ-преглед)
2. [Микросървисна архитектура](#микросървисна-архитектура)
3. [Backend структура](#backend-структура)
4. [Frontend структура](#frontend-структура)
5. [Обща структура на репозитория](#обща-структура-на-репозитория)
6. [Конвенции за именуване](#конвенции-за-именуване)
7. [Организация на модулите](#организация-на-модулите)

---

## Общ преглед

Проектът е организиран като монорепозиторий, съдържащ всички микроуслуги и frontend приложението. Тази структура улеснява споделянето на код между различните компоненти и опростява процеса на разработка.

```
/
├── docs/                  # Документация
├── packages/              # Всички приложения и библиотеки
│   ├── frontend/          # Frontend приложение
│   ├── shared/            # Споделен код
│   └── services/          # Микроуслуги (backend)
├── tools/                 # Допълнителни инструменти и скриптове
└── package.json           # Root package.json (workspace)
```

---

## Микросървисна архитектура

Системата е разделена на следните микроуслуги, всяка в своя директория:

```
/packages/services/
├── auth-service/          # Потребителска автентикация
├── user-service/          # Управление на потребители
├── course-service/        # Курсове и учебно съдържание
├── assignment-service/    # Задачи и предавания
├── evaluation-service/    # Оценяване и тестове
└── ads-service/           # Рекламна система
```

Всяка микроуслуга е независима и може да бъде разработвана, тествана и внедрявана отделно. Комуникацията между услугите се извършва чрез REST API или евентуално чрез message broker в бъдещи версии.

---

## Backend структура

Всяка микроуслуга следва единна структура за NestJS приложения:

```
/packages/services/<service-name>/
├── src/
│   ├── config/            # Конфигурационни файлове
│   ├── controllers/       # HTTP контролери
│   ├── dtos/              # Data Transfer Objects
│   ├── entities/          # TypeORM entitites
│   ├── guards/            # Authentication guards
│   ├── interceptors/      # HTTP interceptors
│   ├── interfaces/        # TypeScript интерфейси
│   ├── middlewares/       # Middleware функции
│   ├── modules/           # Feature модули (domain-specific)
│   ├── repositories/      # Repository класове (ако се използва Repository pattern)
│   ├── services/          # Бизнес логика
│   └── main.ts            # Entry point
├── test/                  # Тестове
│   ├── e2e/               # End-to-end тестове
│   └── unit/              # Unit тестове
├── Dockerfile             # Docker конфигурация
├── nest-cli.json          # NestJS конфигурация
├── package.json           # Зависимости и скриптове
└── tsconfig.json          # TypeScript конфигурация
```

### Feature модули (Domain-Driven Design)

За по-големи микроуслуги, препоръчва се организация по домейни:

```
/packages/services/<service-name>/src/modules/
├── users/
│   ├── controllers/       # User-specific контролери
│   ├── dtos/              # User-specific DTOs
│   ├── entities/          # User-related модели
│   ├── services/          # User-specific услуги
│   └── users.module.ts    # Feature модул
├── courses/
│   ├── controllers/
│   ├── dtos/
│   ├── entities/
│   ├── services/
│   └── courses.module.ts
└── other-feature/
    └── ...
```

---

## Frontend структура

Frontend приложението е организирано според принципите на React и Codux:

```
/packages/frontend/
├── public/                # Статични ресурси
├── src/
│   ├── api/               # API клиенти и hooks
│   ├── assets/            # Изображения, шрифтове и т.н.
│   ├── components/        # React компоненти
│   │   ├── common/        # Общи UI компоненти
│   │   ├── layouts/       # Шаблони
│   │   └── features/      # Feature-specific компоненти
│   ├── config/            # Конфигурации
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Компоненти за страници
│   ├── router/            # Навигация
│   ├── services/          # Frontend услуги
│   ├── store/             # State management
│   ├── styles/            # Глобални стилове
│   ├── types/             # TypeScript типове
│   └── utils/             # Utilities и helpers
├── .env                   # Променливи на средата за локална разработка
├── .env.production        # Променливи за production
├── package.json           # Зависимости и скриптове
├── tsconfig.json          # TypeScript конфигурация
└── vite.config.ts         # Vite конфигурация
```

### Организация на компоненти

Компонентите трябва да следват тази структура:

```
/src/components/common/Button/
├── index.ts               # Експорт на компонента
├── Button.tsx             # Компонент
├── Button.styles.ts       # Стилове (ако не се използва CSS-in-JS)
├── Button.test.tsx        # Тестове
└── Button.stories.tsx     # Storybook stories (опционално)
```

---

## Обща структура на репозитория

Освен директориите за код, репозиторият съдържа:

```
/
├── docs/                  # Документация
│   ├── architecture/      # Архитектурна документация
│   ├── dev-guidelines/    # Указания за разработчици
│   └── stories/           # Потребителски истории
├── .github/               # GitHub конфигурация
│   └── workflows/         # CI/CD workflows
├── .husky/                # Husky hooks
├── .vscode/               # VS Code конфигурация
├── docker/                # Docker конфигурационни файлове
├── scripts/               # Скриптове за разработка
└── .npmrc                 # npm конфигурация
```

---

## Конвенции за именуване

### Backend конвенции (NestJS)

- **Файлове**: kebab-case
  - `user.controller.ts`
  - `auth.service.ts`
  - `user-profile.entity.ts`
  - `create-user.dto.ts`

- **Класове**: PascalCase
  - `UserController`
  - `AuthService`
  - `UserProfile`
  - `CreateUserDto`

- **Променливи и методи**: camelCase
  - `getUserById`
  - `createCourse`
  - `isAuthenticated`

### Frontend конвенции (React)

- **Компоненти**: PascalCase за имена и файлове
  - `Button.tsx`
  - `UserProfile.tsx`

- **Хуукове**: camelCase с 'use' префикс
  - `useAuth.ts`
  - `useLocalStorage.ts`

- **Utilities**: camelCase
  - `formatDate.ts`
  - `validateEmail.ts`

- **Константи**: SCREAMING_SNAKE_CASE
  - `MAX_FILE_SIZE`
  - `API_ENDPOINT`

---

## Организация на модулите

### Backend модули

Всеки NestJS модул трябва да следва структурата:

```typescript
@Module({
  imports: [/* Зависими модули */],
  controllers: [/* Контролери */],
  providers: [/* Услуги */],
  exports: [/* Експортирани провайдъри */]
})
export class FeatureModule {}
```

### Frontend модули

React компонентите трябва да следват принципа на композиция и да бъдат организирани според отговорността им:

1. **Атомарни**: базови UI елементи (Button, Input, Card)
2. **Молекули**: прости групи от атомарни компоненти (SearchField, UserCard)
3. **Организми**: по-сложни групи от молекули и атомарни компоненти (Header, Sidebar)
4. **Шаблони**: структури за разполагане на организми (PageLayout, DashboardLayout)
5. **Страници**: специфични изглед, комбиниращи компоненти (HomePage, CourseDetailsPage)

---

## Управление на зависимости

### Backend зависимости

- NestJS пакети са достъпни във всички микроуслуги
- Всяка микроуслуга локално управлява своите специфични зависимости
- Общите зависимости се дефинират в root package.json

### Frontend зависимости

- Material-UI се използва за компоненти
- Tailwind CSS се използва за стилизация
- React Query за управление на заявки към API
- React Router за навигация
- TypeScript за type safety

---

## Връзки към други документи

- [Coding Standards](./coding-standards.md)
- [Tech Stack](./tech-stack.md)
- [Backend Architecture](./backend-architecture.md)
- [Frontend Architecture](./frontend-architecture.md)
