# Task 1.2.3: Data Seeding

## 🎯 Цел

Създаване на начални данни за разработка и тестване на приложението.

## 🛠️ Действия

1. Създаване на seeders за основните ентитита
2. Имплементиране на CLI команди за генериране на данни
3. Добавяне на тестови данни за разработка
4. Документиране на процеса за генериране на данни

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
