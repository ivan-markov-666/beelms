# Task 1.2.3: Data Seeding

## 🎯 Статус на задачата

**Текущ статус**: ✅ ЗАДАЧАТА ЗАВЪРШЕНА - Всички фази имплементирани

**Постижения**:

- ✅ Фаза 1: Core infrastructure и entity seeders
- ✅ Фаза 2: CLI интеграция с comprehensive command interface
- ✅ Фаза 3: Docker интеграция и production-ready deployment

**Финални файлове**:

- `SEEDING_COMPLETE.md` - Пълна имплементация обзор
- `DOCKER.md` - Docker интеграция документация
- `CLI.md` - CLI usage guide
- Всички тестове минават успешно
- Готово за production deployment

## 🎯 Цел

Създаване на начални данни за разработка и тестване на приложението.

## 🛠️ Действия

1. Създаване на seeders за основните ентитита
2. Имплементиране на CLI команди за генериране на данни
3. Добавяне на тестови данни за разработка
4. Документиране на процеса за генериране на данни

## 📑 Фази на изпълнение

Задачата е разделена на следните фази за по-ефективно изпълнение:

### Фаза 1: Базова структура и абстракция

- Създаване на базовия DatabaseSeeder клас
- Имплементиране на абстракция за съвместимост между SQLite и PostgreSQL
- Създаване на основни методи за seeding

### Фаза 2: Имплементация на seeders за ентитита

- Имплементиране на User seeder
- Имплементиране на Category seeder
- Имплементиране на Course seeder
- Имплементиране на Topic seeder

### Фаза 3: CLI интеграция и тестване

- Създаване на CLI команда с опции
- Интеграция с Docker среда
- Писане на интеграционни тестове
- Документиране на процеса

## ⚙️ Технически решения

### SQLite съвместимост

- Използване на `type: 'simple-json'` вместо `jsonb` за JSON колони
- Използване на `type: 'datetime'` вместо `timestamp` за дата колони
- За енумерации - `type: 'varchar'` с `@Check` ограничения
- Тестване и с двете бази данни (PostgreSQL и SQLite)

### Структура на seeders

- Единен подход с главен DatabaseSeeder клас
- Отделни методи за всеки тип entity (`seedUsers()`, `seedCategories()`, etc.)
- Последователност базирана на зависимостите между ентититата

### CLI интеграция

- Използване на Commander.js за CLI интерфейса
- Команда `db:seed` с опции:
  - `--env` - за избор на средата (dev по подразбиране)
  - `--entity` - за seeding само на определени entity-та
  - `--preserve` - флаг за запазване на съществуващите данни

### Non-destructive seeding

- По подразбиране: destructive (изчистване и ново populating)
- С опция `--preserve`: non-destructive (добавяне към съществуващи данни)

### Docker интеграция

- Скрипт в package.json: `docker:seed` за изпълнение в контейнера
- Конфигуриране на volume за персистентност на базата данни
- Инициализационен скрипт за автоматично seeding

## ✅ Статус на имплементацията

### Фаза 1: Завършена ✅

**Дата на завършване:** 2025-01-17

**Имплементирани компоненти:**

- ✅ `DatabaseSeeder` - основен клас за seeding
- ✅ `DatabaseProvider` - абстракция за различните типове бази данни
- ✅ `SeederFactory` - factory за създаване на seeder instances
- ✅ SQLite и PostgreSQL съвместимост
- ✅ Базови seeding методи за всички основни ентитита
- ✅ Тестове за основната функционалност
- ✅ Примерен код за демонстрация

**Файлове и директории:**

```
packages/database/
├── src/
│   ├── seeders/
│   │   ├── database.seeder.ts
│   │   └── database.seeder.test.ts
│   ├── providers/
│   │   └── database.provider.ts
│   ├── factories/
│   │   └── seeder.factory.ts
│   ├── examples/
│   │   └── seed-demo.ts
│   └── index.ts
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

**Следващи стъпки:**

- ✅ Фаза 2: Имплементация на CLI команди (ЗАВЪРШЕНА)
- Фаза 3: Docker интеграция и финализиране

## ✅ Фаза 2: CLI Интеграция (Завършена)

**Имплементирани компоненти:**

### CLI Инструмент

- ✅ Имплементиран CLI инструмент с командово редови аргументи
- ✅ Поддръжка за среди (dev, test, prod)
- ✅ Опция за филтриране на ентити
- ✅ Деструктивни и недеструктивни режими
- ✅ Verbose логиране

### Команди

- ✅ `run` - стартиране на seeding процеса
- ✅ `demo` - демонстрация на различни сценарии
- ✅ `status` - статус на базата данни
- ✅ `help` - помощна информация

### Технически детайли

- ✅ Без зависимост от Commander.js (решени проблеми с депенденсите)
- ✅ Собствен argument parser за флексибилност
- ✅ TypeScript типове за безопасност
- ✅ Обработка на грешки и валидация
- ✅ Graceful shutdown с правилни exit кодове
- ✅ ts-node конфигурация за CommonJS съвместимост (tsconfig.cli.json)
- ✅ bcryptjs вместо bcrypt за Windows съвместимост (без нативни dependencies)

### Подобрения

- ✅ Добавен `createProdSeeder` метод в SeederFactory
- ✅ Поправени типове за environment валидация
- ✅ Подобрена структура на кода

### Интеграционни тестове

- ✅ Тестове за CLI команди
- ✅ Валидация на аргументи
- ✅ Тестове за среди и опции

### Файлова структура на CLI

```
packages/database/src/cli/
├── seed.ts                      # Основен CLI инструмент
└── seed.integration.test.ts     # Интеграционни тестове
```

### Документация

- ✅ Пълна CLI документация в `CLI.md`
- ✅ Примери за употреба
- ✅ Описание на всички опции

### Примери за употреба

```bash
# Основно стартиране
pnpm db:seed:dev

# Конкретни ентити (в database директорията)
cd packages/database
pnpm db:seed:dev run --entities users,categories

# Недеструктивно стартиране (в database директорията)
cd packages/database
pnpm db:seed:dev run --preserve --verbose

# Демонстрация
pnpm db:seed:demo

# Статус
pnpm db:seed:status
```

## ✅ Фаза 3: Docker интеграция и финализиране - ЗАВЪРШЕНА

### Имплементирани Docker компоненти:

1. **Dockerfile.seeder** - Специализиран Docker образ за seeding
   - Базиран на `node:18-alpine` за сигурност и производителност
   - Безопасен non-root user (`seeder`)
   - Инсталирани зависимости: pnpm, tsx, PostgreSQL client
   - Вградена health check функционалност

2. **docker-compose.seeder.yml** - Оркестриране на услуги
   - PostgreSQL database service с health check
   - Seeding service с environment конфигурация
   - Demo и status services с profiles
   - Мрежова изолация и volume управление

3. **Environment файлове**
   - `.env.dev` - Development конфигурация
   - `.env.test` - Test конфигурация
   - `.env.prod` - Production конфигурация

4. **Docker скриптове**
   - `scripts/docker-seed.sh` - Linux/macOS скрипт
   - `scripts/docker-seed.bat` - Windows скрипт
   - Поддържа всички команди и опции

5. **Makefile** - Удобни команди за разработка
   - `make build`, `make run`, `make demo`, `make status`
   - Environment-specific targets
   - Backup и restore функционалност

6. **npm scripts** - Интеграция с package.json
   - `docker:build`, `docker:seed:dev`, `docker:seed:test`, `docker:seed:prod`
   - `docker:demo`, `docker:status`, `docker:logs`, `docker:clean`

7. **init-db.sql** - Database инициализация
   - Автоматично създаване на databases
   - Seeder user с ограничени права
   - Logging table за операции

### Интеграционни тестове:

- Docker build и run валидация
- Environment файлове проверка
- Compose конфигурация тестване
- Service health checks

### Документация:

- **DOCKER.md** - Пълна Docker интеграция документация
- Примери за използване
- Troubleshooting guide
- Security considerations

### Примери за използване:

```bash
# Quick development setup
make quick-dev

# Run seeding for different environments
make run ENV=dev
make run ENV=test
make run ENV=prod

# Run demonstration
make demo

# Check status
make status

# Using npm scripts
pnpm docker:seed:dev
pnpm docker:demo
pnpm docker:status

# Using Docker Compose directly
docker-compose -f docker-compose.seeder.yml --env-file .env.dev run --rm db-seeder
```

### Готовност за production:

- Секурни Docker образи
- Environment-specific конфигурации
- Health monitoring
- Backup и restore функционалност
- CI/CD интеграция

## 📋 Код

### Database Seeder

```typescript
// packages/database/src/seeders/database.seeder.ts
import { DataSource } from 'typeorm';
import { Seeder, SeederFactoryManager } from 'typeorm-extension';
import { User } from '../../shared-types/src/entities/user.entity';
import { Category } from '../../shared-types/src/entities/category.entity';
import { Course } from '../../shared-types/src/entities/course.entity';
import { Topic } from '../../shared-types/src/entities/topic.entity';
import { UserRole } from '../../shared-types/src/entities/user.entity';
import * as bcrypt from 'bcrypt';

export class DatabaseSeeder implements Seeder {
  public async run(dataSource: DataSource, factoryManager: SeederFactoryManager): Promise<void> {
    // Clear existing data
    await dataSource.dropDatabase();
    await dataSource.synchronize();

    // Get repositories
    const userRepository = dataSource.getRepository(User);
    const categoryRepository = dataSource.getRepository(Category);
    const courseRepository = dataSource.getRepository(Course);
    const topicRepository = dataSource.getRepository(Topic);

    // Create admin user
    const admin = new User();
    admin.email = 'admin@example.com';
    admin.username = 'admin';
    admin.passwordHash = await bcrypt.hash('admin123', 10);
    admin.firstName = 'Admin';
    admin.lastName = 'User';
    admin.role = UserRole.ADMIN;
    admin.isActive = true;
    await userRepository.save(admin);

    // Create test instructor
    const instructor = new User();
    instructor.email = 'instructor@example.com';
    instructor.username = 'instructor';
    instructor.passwordHash = await bcrypt.hash('instructor123', 10);
    instructor.firstName = 'John';
    instructor.lastName = 'Doe';
    instructor.role = UserRole.INSTRUCTOR;
    instructor.isActive = true;
    await userRepository.save(instructor);

    // Create test student
    const student = new User();
    student.email = 'student@example.com';
    student.username = 'student';
    student.passwordHash = await bcrypt.hash('student123', 10);
    student.firstName = 'Jane';
    student.lastName = 'Smith';
    student.role = UserRole.STUDENT;
    student.isActive = true;
    await userRepository.save(student);

    // Create categories
    const categories = [
      { name: 'Програмиране', description: 'Уроци по програмиране', colorCode: '#2196F3' },
      { name: 'Дизайн', description: 'Уроци по дизайн', colorCode: '#9C27B0' },
      { name: 'Маркетинг', description: 'Уроци по маркетинг', colorCode: '#4CAF50' },
      { name: 'Бизнес', description: 'Бизнес уроци', colorCode: '#FF9800' },
      { name: 'Личностно Развитие', description: 'Уроци за личностно развитие', colorCode: '#E91E63' },
    ];

    const savedCategories = [];
    for (const categoryData of categories) {
      const category = new Category();
      Object.assign(category, categoryData);
      const savedCategory = await categoryRepository.save(category);
      savedCategories.push(savedCategory);
    }

    // Create sample courses
    const courses = [
      {
        title: 'Въведение в JavaScript',
        slug: 'introduction-to-javascript',
        description: 'Научете основите на JavaScript програмирането',
        categoryId: savedCategories[0].id,
        isPublished: true,
        createdById: instructor.id,
      },
      {
        title: 'React за начинаещи',
        slug: 'react-for-beginners',
        description: 'Започнете с React и създавайте модерни уеб приложения',
        categoryId: savedCategories[0].id,
        isPublished: true,
        createdById: instructor.id,
      },
    ];

    const savedCourses = [];
    for (const courseData of courses) {
      const course = new Course();
      Object.assign(course, {
        ...courseData,
        publishedAt: new Date(),
      });
      const savedCourse = await courseRepository.save(course);
      savedCourses.push(savedCourse);
    }

    // Create sample topics for the first course
    const topics = [
      {
        title: 'Какво е JavaScript?',
        slug: 'what-is-javascript',
        courseId: savedCourses[0].id,
        orderIndex: 1,
        createdById: instructor.id,
      },
      {
        title: 'Променливи и типове данни',
        slug: 'variables-and-data-types',
        courseId: savedCourses[0].id,
        orderIndex: 2,
        createdById: instructor.id,
      },
    ];

    const savedTopics = [];
    for (const topicData of topics) {
      const topic = new Topic();
      Object.assign(topic, topicData);
      const savedTopic = await topicRepository.save(topic);
      savedTopics.push(savedTopic);
    }

    console.log('✅ Database seeded successfully!');
  }
}
```

### CLI Command

```typescript
// packages/cli/src/commands/seed.command.ts
import { Command } from 'commander';
import { DataSource } from 'typeorm';
import { DatabaseSeeder } from '../../database/src/seeders/database.seeder';
import { dataSourceOptions } from '../config/data-source';

export const seedCommand = new Command('db:seed')
  .description('Seed the database with initial data')
  .action(async () => {
    try {
      console.log('🚀 Seeding database...');

      const dataSource = new DataSource({
        ...dataSourceOptions,
        entities: ['dist/**/*.entity{.ts,.js}'],
        synchronize: false,
      });

      await dataSource.initialize();

      const seeder = new DatabaseSeeder();
      await seeder.run(dataSource, null);

      console.log('✅ Database seeded successfully!');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      process.exit(1);
    }
  });
```

### Integration Test

```typescript
// test/seed-database.test.ts
import { DataSource } from 'typeorm';
import { DatabaseSeeder } from '../packages/database/src/seeders/database.seeder';
import { dataSourceOptions } from '../packages/api/src/config/data-source';
import { User } from '../packages/shared-types/src/entities/user.entity';
import { Category } from '../packages/shared-types/src/entities/category.entity';

describe('Database Seeder', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      ...dataSourceOptions,
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: false,
    });
    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should seed the database with initial data', async () => {
    // Act
    const seeder = new DatabaseSeeder();
    await seeder.run(dataSource, null);

    // Assert
    const userRepository = dataSource.getRepository(User);
    const users = await userRepository.find();
    expect(users.length).toBeGreaterThan(0);

    const categoryRepository = dataSource.getRepository(Category);
    const categories = await categoryRepository.find();
    expect(categories.length).toBeGreaterThan(0);
  });
});
```

## 📦 Deliverables

- [x] Seeder за генериране на тестови данни
- [x] CLI команда за стартиране на seed-ването
- [x] Интеграционни тестове за seed-ването
- [x] Документация за използване

## 🚀 Употреба

```bash
# Инсталиране на зависимостите
pnpm install

# Стартиране на seed-ването
pnpm cli db:seed
```

## 🧪 Тестване

```bash
# Стартиране на интеграционните тестове
pnpm test:integration
```

## 📝 Документация

### Генерирани тестови акаунти

1. **Администратор**
   - Email: admin@example.com
   - Парола: admin123
   - Роля: Администратор

2. **Инструктор**
   - Email: instructor@example.com
   - Парола: instructor123
   - Роля: Инструктор

3. **Студент**
   - Email: student@example.com
   - Парола: student123
   - Роля: Студент

### Генерирани данни

- 5 категории
- 2 курса
- 2 теми в първия курс

## 📝 Бележки

- Seed-ването ще изтрие всички съществуващи данни в базата
- Уверете се, че сте в development среда преди да изпълните seed-ването
- Добавете още данни според нуждите на разработката
