# Стандарти за кодиране

Този документ описва стандартите и конвенциите за кодиране, които се използват в проекта, за да се осигури консистентен и поддържаем код.

## Съдържание
1. [Общи принципи](#общи-принципи)
2. [Инструменти](#инструменти)
3. [TypeScript стандарти](#typescript-стандарти)
4. [NestJS стандарти](#nestjs-стандарти)
5. [React стандарти](#react-стандарти)
6. [SQL стандарти](#sql-стандарти)
7. [Code review процес](#code-review-процес)
8. [Документация](#документация)

## Общи принципи

- **Четимост преди всичко** - Кодът се чете много по-често, отколкото се пише
- **Консистентност** - Следвайте установените конвенции в проекта
- **KISS принцип** - Keep It Simple, Stupid
- **DRY принцип** - Don't Repeat Yourself
- **SOLID принципи** - Особено за класове и модули
- **Чисти функции** - Предвидими, без странични ефекти, когато е възможно
- **Ранно връщане** - Избягвайте дълбоко влагане на условни оператори

## Инструменти

Проектът използва следните инструменти за осигуряване на качествен код:

### ESLint

- **Версия**: Последна съвместима с TypeScript 5.x
- **Конфигурация**: `.eslintrc.js` в основната директория
- **Основни правила**:
  - Стриктен TypeScript
  - Без предупреждения в production код
  - React правила за компоненти
  - Правила за достъпност (a11y)

**Команда за проверка**:
```bash
npm run lint
```

### Prettier

- **Версия**: Последна стабилна
- **Конфигурация**: `.prettierrc` в основната директория
- **Стандартни настройки**:
  - Единични кавички (')
  - Без точка и запетая (;) в края на редовете
  - 2 интервала за отстъп
  - 150 символа максимална дължина на ред
  - Trailing commas за многоредови обекти и масиви

**Команда за форматиране**:
```bash
npm run format
```

### Husky & lint-staged

Pre-commit hooks автоматично изпълняват:
1. Lint проверки
2. Type checking
3. Форматиране на променените файлове
4. Проверка на conventional commits формата

## TypeScript стандарти

- **Версия**: 5.x
- **Строга типизация**: `"strict": true` в tsconfig.json
- **Типове и интерфейси**:
  - Използвайте `interface` за обекти, които могат да бъдат разширявани
  - Използвайте `type` за union типове и типове, които не трябва да се разширяват
  - Избягвайте `any` тип - използвайте `unknown` когато типът не е известен, като се стремим никога да не изпадаме в този случай, но ако нямаме друг избор важи правилото за `unknown`.
  - Явно типизирайте функционални параметри и връщани стойности

```typescript
// Добре
interface UserData {
  id: string
  name: string
  email: string
}

// Избягвайте
const getUserData = (id): any => {
  // ...
}

// Добре
const getUserData = (id: string): Promise<UserData> => {
  // ...
}
```

## NestJS стандарти

- **Структура на проекта**: Следвайте [Unified Project Structure](./unified-project-structure.md)
- **Именуване на файлове**: Използвайте kebab-case за имена на файлове
- **Декоратори**: Подреждайте декоратори от общи към специфични

```typescript
@Controller('users')
@ApiTags('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  // ...
}
```

- **Dependency Injection**: Използвайте constructor-based DI
- **Бизнес логика**: Поставяйте в services, не в controllers
- **DTO валидация**: Използвайте class-validator декоратори за валидация
- **Exception handling**: Използвайте вградените NestJS exceptions

## React стандарти
Ппонеже ще се използва Codux. Трябва да се провери, дали може да се добавят следните стандарти:
- **Функционални компоненти**: Предпочитайте функционални компоненти с hooks
- **Типизация**: Използвайте TypeScript интерфейси за props
- **Стилове**: Следвайте Tailwind + MUI конвенции
- **Именуване на компоненти**: PascalCase за компоненти и файлове
- **State management**: 
  - Локален state с useState/useReducer
  - Глобален state с Redux Toolkit
  - Async/API data с React Query

```tsx
// Добре
const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false)
  
  return (
    <div className="flex flex-col p-4">
      {/* ... */}
    </div>
  )
}
```

## SQL стандарти

- **Именуване на таблици**: snake_case, множествено число
- **Именуване на колони**: snake_case, единствено число
- **Primary keys**: Винаги използвайте `id` или `<table_name>_id`
- **Foreign keys**: Именувайте като `<referenced_table_singular>_id`
- **Индексиране**: Индексирайте колони, използвани в JOIN и WHERE клаузи
- **Избягвайте**: Сложни заявки в приложението, използвайте views или stored procedures

```sql
-- Добре
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Също добре
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  avatar_url TEXT
);
```

## Code Review процес

Code Review процесът е описан подробно в [Code Review Checklist](../dev-guidelines/code-review-checklist.md) и включва проверки за:

1. **Логическа коректност** - Правилна логика и обхванати гранични случаи
2. **Стил и консистентност** - Съответствие с ESLint и Prettier
3. **Типова безопасност** - Стриктна типизация без излишни `any` типове
4. **Тестване** - Unit/Integration тестове с покритие ≥ 80%
5. **Сигурност** - Валидация на входове, защита срещу уязвимости
6. **Производителност** - Оптимизирани алгоритми и заявки

## Документация

- **JSDoc/TSDoc** коментари за публични API и сложни функции
- **Swagger/OpenAPI** документация за всички REST endpoints
- **README файлове** за всяка основна директория с описание на компонентите
- **CHANGELOG** за проследяване на промените

```typescript
/**
 * Извлича потребител по ID
 * @param id - Уникален идентификатор на потребителя
 * @returns Потребителски данни или null ако не е намерен
 * @throws NotFoundError ако потребителят не съществува
 */
async function getUser(id: string): Promise<User | null> {
  // ...
}
```

## Целеви метрики за качество на код

- ESLint/TS linter критични грешки: **0** в `main` branch
- Test coverage: **≥ 80%** на бизнес логика
- Цикломатична сложност: **≤ 15** за функция
- Повторение на код: **≤ 5%**
- Технически дълг: Проактивно адресиране, без натрупване

## Допълнителни ресурси

- [Tech Stack](./tech-stack.md) - Детайлна информация за използваните технологии
- [Testing Strategy](./testing-strategy.md) - Стандарти за тестване
- [Unified Project Structure](./unified-project-structure.md) - Организация на проекта
