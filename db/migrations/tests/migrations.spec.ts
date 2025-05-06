import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { CreateInitialSchema1683456789000 } from '../migrations/1683456789000-CreateInitialSchema';
import { AddAdditionalIndices1683456789001 } from '../migrations/1683456789001-AddAdditionalIndices';

// Зареждане на .env.test
dotenv.config({ path: '.env.test' });

describe('Database Migrations', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    try {
      // Настройка на тестова база данни с директно реферирани миграции
      dataSource = new DataSource({
        type: 'postgres',
        host: 'localhost',
        port: 5433,
        username: 'test_user',
        password: 'test_password',
        database: 'test_db',
        synchronize: false,
        logging: true,
        entities: [],
        migrations: [CreateInitialSchema1683456789000, AddAdditionalIndices1683456789001],
        migrationsTableName: 'migrations_history_test',
      });

      console.log('Опит за свързване с базата данни...');
      await dataSource.initialize();
      console.log('Връзката с базата данни е успешна!');
    } catch (error) {
      console.error('Грешка при свързване с базата данни:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('should run migrations up successfully', async () => {
    // Изпълнение на миграциите
    await dataSource.runMigrations();

    // Проверка дали миграциите са успешно изпълнени
    const appliedMigrations = await dataSource.query(`
      SELECT * FROM migrations_history_test ORDER BY id ASC
    `);

    expect(appliedMigrations.length).toBeGreaterThan(0);
  });

  it('should run migrations down successfully', async () => {
    // Връщане на последната миграция
    await dataSource.undoLastMigration();

    // Проверка дали миграцията е успешно върната
    const appliedMigrations = await dataSource.query(`
      SELECT * FROM migrations_history_test ORDER BY id ASC
    `);

    // Трябва да има с една миграция по-малко
    const migrationClasses = [CreateInitialSchema1683456789000, AddAdditionalIndices1683456789001];

    expect(appliedMigrations.length).toBe(migrationClasses.length - 1);
  });
});
