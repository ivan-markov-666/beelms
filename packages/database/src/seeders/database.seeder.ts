import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import {
  User,
  Category,
  Topic,
  TopicContent,
  Test,
  Question,
  QuestionOption,
  UserRole,
  QuestionType,
} from '@lms/shared-types';

export interface SeederOptions {
  /**
   * Whether to clear existing data before seeding
   * @default true
   */
  destructive?: boolean;

  /**
   * Environment for seeding (affects data generation)
   * @default 'dev'
   */
  environment?: 'dev' | 'test' | 'prod';

  /**
   * Specific entities to seed (if not provided, seeds all)
   */
  entities?: string[];

  /**
   * Database type for compatibility adjustments
   */
  databaseType?: 'postgres' | 'sqlite';
}

export class DatabaseSeeder {
  private dataSource: DataSource;
  private options: Required<SeederOptions>;

  constructor(dataSource: DataSource, options: SeederOptions = {}) {
    this.dataSource = dataSource;
    this.options = {
      destructive: true,
      environment: 'dev',
      databaseType: 'postgres',
      ...options,
      // Ensure entities is always an array
      entities: options.entities || [],
    };
  }

  /**
   * Main seeding method that orchestrates the entire process
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 Starting database seeding...');

      // Clear existing data if destructive mode is enabled
      if (this.options.destructive) {
        await this.clearDatabase();
      }

      // Seed entities in dependency order
      await this.seedUsers();
      await this.seedCategories();
      await this.seedTopics();
      await this.seedTopicContent();
      await this.seedTests();
      await this.seedQuestions();
      await this.seedQuestionOptions();

      console.log('✅ Database seeded successfully!');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
      throw error;
    }
  }

  /**
   * Clear existing data from all tables
   */
  private async clearDatabase(): Promise<void> {
    console.log('🧹 Clearing existing data...');

    const entities = [
      'question_options',
      'questions',
      'tests',
      'user_progress',
      'test_attempts',
      'topic_contents', // Fixed table name - it's topic_contents not topic_content
      'topics',
      'categories',
      'users',
    ];

    // For SQLite, we need to disable foreign key checks temporarily
    if (this.options.databaseType === 'sqlite') {
      await this.dataSource.query('PRAGMA foreign_keys = OFF');
    }

    // Clear tables in reverse dependency order
    for (const tableName of entities) {
      try {
        await this.dataSource.query(`DELETE FROM ${tableName}`);
        console.log(`  ✓ Cleared ${tableName}`);
      } catch (error) {
        console.warn(`  ⚠️ Could not clear ${tableName}:`, (error as Error).message);
      }
    }

    // Re-enable foreign key checks for SQLite
    if (this.options.databaseType === 'sqlite') {
      await this.dataSource.query('PRAGMA foreign_keys = ON');
    }
  }

  /**
   * Seed users with different roles
   */
  private async seedUsers(): Promise<void> {
    if (this.shouldSkipEntity('users')) return;

    console.log('👥 Seeding users...');
    const userRepository = this.dataSource.getRepository(User);

    const users = [
      {
        email: 'admin@example.com',
        username: 'admin',
        passwordHash: await bcrypt.hash('admin123', 10),
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
        preferredLanguage: 'bg',
      },
      {
        email: 'instructor@example.com',
        username: 'instructor',
        passwordHash: await bcrypt.hash('instructor123', 10),
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.INSTRUCTOR,
        isActive: true,
        preferredLanguage: 'bg',
      },
      {
        email: 'student@example.com',
        username: 'student',
        passwordHash: await bcrypt.hash('student123', 10),
        firstName: 'Jane',
        lastName: 'Smith',
        role: UserRole.STUDENT,
        isActive: true,
        preferredLanguage: 'bg',
      },
    ];

    for (const userData of users) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(`  ✓ Created user: ${userData.email}`);
    }
  }

  /**
   * Seed categories for organizing topics
   */
  private async seedCategories(): Promise<void> {
    if (this.shouldSkipEntity('categories')) return;

    console.log('📂 Seeding categories...');
    const categoryRepository = this.dataSource.getRepository(Category);

    const categories = [
      {
        name: 'QA Fundamentals',
        description: 'Основи на Quality Assurance и тестване на софтуер',
        colorCode: '#2196F3',
        iconName: 'school',
        sortOrder: 1,
      },
      {
        name: 'Test Automation',
        description: 'Автоматизирано тестване и инструменти',
        colorCode: '#4CAF50',
        iconName: 'smart_toy',
        sortOrder: 2,
      },
      {
        name: 'Performance Testing',
        description: 'Тестване на производителност и натоварване',
        colorCode: '#FF9800',
        iconName: 'speed',
        sortOrder: 3,
      },
      {
        name: 'Security Testing',
        description: 'Тестване на сигурност и уязвимости',
        colorCode: '#F44336',
        iconName: 'security',
        sortOrder: 4,
      },
      {
        name: 'API Testing',
        description: 'Тестване на API и уеб услуги',
        colorCode: '#9C27B0',
        iconName: 'api',
        sortOrder: 5,
      },
    ];

    for (const categoryData of categories) {
      const category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
      console.log(`  ✓ Created category: ${categoryData.name}`);
    }
  }

  /**
   * Seed topics (lessons) for each category
   */
  private async seedTopics(): Promise<void> {
    if (this.shouldSkipEntity('topics')) return;

    console.log('📚 Seeding topics...');
    const topicRepository = this.dataSource.getRepository(Topic);
    const categoryRepository = this.dataSource.getRepository(Category);

    // Get the first category for demo topics
    const qaFundamentals = await categoryRepository.findOne({
      where: { name: 'QA Fundamentals' },
    });

    if (!qaFundamentals) {
      console.warn('  ⚠️ QA Fundamentals category not found, skipping topics');
      return;
    }

    const topics = [
      {
        categoryId: qaFundamentals.id,
        topicNumber: 1,
        name: 'Въведение в QA',
        slug: 'introduction-to-qa',
        estimatedReadingTime: 15,
      },
      {
        categoryId: qaFundamentals.id,
        topicNumber: 2,
        name: 'Видове тестване',
        slug: 'types-of-testing',
        estimatedReadingTime: 20,
      },
      {
        categoryId: qaFundamentals.id,
        topicNumber: 3,
        name: 'Жизнен цикъл на тестването',
        slug: 'testing-lifecycle',
        estimatedReadingTime: 25,
      },
    ];

    for (const topicData of topics) {
      const topic = topicRepository.create(topicData);
      await topicRepository.save(topic);
      console.log(`  ✓ Created topic: ${topicData.name}`);
    }
  }

  /**
   * Seed topic content (multilingual support)
   */
  private async seedTopicContent(): Promise<void> {
    if (this.shouldSkipEntity('topicContent')) return;

    console.log('📝 Seeding topic content...');
    const topicContentRepository = this.dataSource.getRepository(TopicContent);
    const topicRepository = this.dataSource.getRepository(Topic);

    const topics = await topicRepository.find();

    for (const topic of topics) {
      const content = topicContentRepository.create({
        topicId: topic.id,
        languageCode: 'bg',
        content: `# ${topic.name}\n\nТова е примерно съдържание за ${topic.name}. Тук ще бъде поставено пълното съдържание на лекцията.\n\n## Основни теми\n\n- Въведение\n- Практически примери\n- Заключение`,
      });

      await topicContentRepository.save(content);
      console.log(`  ✓ Created content for topic: ${topic.name}`);
    }
  }

  /**
   * Seed tests for topics
   */
  private async seedTests(): Promise<void> {
    if (this.shouldSkipEntity('tests')) return;

    console.log('📋 Seeding tests...');
    const testRepository = this.dataSource.getRepository(Test);
    const topicRepository = this.dataSource.getRepository(Topic);

    const topics = await topicRepository.find();

    for (const topic of topics) {
      const test = testRepository.create({
        topicId: topic.id,
        title: `Тест за ${topic.name}`,
        passingPercentage: 70,
        maxAttempts: 3,
      });

      await testRepository.save(test);
      console.log(`  ✓ Created test for topic: ${topic.name}`);
    }
  }

  /**
   * Seed questions for tests
   */
  private async seedQuestions(): Promise<void> {
    if (this.shouldSkipEntity('questions')) return;

    console.log('❓ Seeding questions...');
    const questionRepository = this.dataSource.getRepository(Question);
    const testRepository = this.dataSource.getRepository(Test);

    const tests = await testRepository.find();

    for (const test of tests) {
      const questions = [
        {
          testId: test.id,
          questionType: QuestionType.SINGLE,
          questionText: 'Какво е QA?',
          explanation: 'QA (Quality Assurance) е процес за осигуряване на качество в разработката на софтуер.',
          sortOrder: 1,
        },
        {
          testId: test.id,
          questionType: QuestionType.MULTIPLE,
          questionText: 'Кои са основните видове тестване?',
          explanation: 'Основните видове тестване включват функционално, нефункционално и структурно тестване.',
          sortOrder: 2,
        },
      ];

      for (const questionData of questions) {
        const question = questionRepository.create(questionData);
        await questionRepository.save(question);
        console.log(`  ✓ Created question for test: ${test.title}`);
      }
    }
  }

  /**
   * Seed question options
   */
  private async seedQuestionOptions(): Promise<void> {
    if (this.shouldSkipEntity('questionOptions')) return;

    console.log('✅ Seeding question options...');
    const questionOptionRepository = this.dataSource.getRepository(QuestionOption);
    const questionRepository = this.dataSource.getRepository(Question);

    const questions = await questionRepository.find();

    for (const question of questions) {
      const options = [
        {
          questionId: question.id,
          optionText: 'Правилен отговор',
          isCorrect: true,
          sortOrder: 1,
        },
        {
          questionId: question.id,
          optionText: 'Неправилен отговор 1',
          isCorrect: false,
          sortOrder: 2,
        },
        {
          questionId: question.id,
          optionText: 'Неправилен отговор 2',
          isCorrect: false,
          sortOrder: 3,
        },
      ];

      for (const optionData of options) {
        const option = questionOptionRepository.create(optionData);
        await questionOptionRepository.save(option);
      }

      console.log(`  ✓ Created options for question: ${question.questionText}`);
    }
  }

  /**
   * Check if an entity should be skipped based on options
   */
  private shouldSkipEntity(entityName: string): boolean {
    // Ensure entities is always an array and handle undefined case
    const entities = this.options.entities || [];

    if (entities.length === 0) {
      return false; // Seed all entities if none specified
    }

    return !entities.includes(entityName);
  }
}
