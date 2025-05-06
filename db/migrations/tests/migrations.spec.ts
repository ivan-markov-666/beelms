import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

dotenv.config({ path: '.env.test' });

describe('Database Migrations', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    // Настройка на тестова база данни
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
      username: process.env.TEST_DB_USER || 'test_user',
      password: process.env.TEST_DB_PASSWORD || 'test_password',
      database: process.env.TEST_DB_NAME || 'test_db',
      synchronize: false,
      logging: false,
      entities: [], // Няма нужда от ентитита за тестването на миграции
      migrations: ['migrations/**/*.ts'],
      migrationsTableName: 'migrations_history_test',
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    // Почистване
    if (dataSource && dataSource.isInitialized) {
      // Изтриване на всички таблици
      await dataSource.query(`
        DO $$ DECLARE
          r RECORD;
        BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
        END $$;
      `);
      await dataSource.destroy();
    }
  });

  it('should run migrations up successfully', async () => {
    // Извличане на всички миграционни файлове
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.ts'))
      .sort();

    // Проверка дали има миграционни файлове
    expect(migrationFiles.length).toBeGreaterThan(0);

    // Изпълнение на миграциите
    await dataSource.runMigrations();

    // Проверка дали миграциите са успешно изпълнени
    const appliedMigrations = await dataSource.query(`
      SELECT * FROM migrations_history_test ORDER BY id ASC
    `);

    expect(appliedMigrations.length).toBe(migrationFiles.length);

    // Проверка на структурата на базата данни
    const tables = await dataSource.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    // Очакваме да има определени таблици
    const expectedTables = [
      'advertisements',
      'chapters',
      'contents',
      'courses',
      'migrations_history_test',
      'password_resets',
      'questions',
      'sessions',
      'tests',
      'user_ad_views',
      'user_answers',
      'user_profiles',
      'user_progress',
      'user_test_attempts',
      'users',
    ];

    expectedTables.forEach((tableName) => {
      expect(tables.some((t) => t.table_name === tableName)).toBeTruthy();
    });
  });

  it('should run migrations down successfully', async () => {
    // Изпълнение на миграциите надолу
    await dataSource.undoLastMigration();

    // Проверка дали миграциите са успешно върнати
    const appliedMigrations = await dataSource.query(`
      SELECT * FROM migrations_history_test ORDER BY id ASC
    `);

    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.ts'))
      .sort();

    expect(appliedMigrations.length).toBe(migrationFiles.length - 1);
  });
});
