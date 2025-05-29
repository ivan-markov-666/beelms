import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';
import { CreateInitialSchema1683456789000 } from '../migrations/1683456789000-CreateInitialSchema';
import { AddAdditionalIndices1683456789001 } from '../migrations/1683456789001-AddAdditionalIndices';

describe('Database Migrations', () => {
  let container: StartedTestContainer;
  let dataSource: DataSource;

  // Увеличаваме таймаута до 2 минути (120000 ms)
  jest.setTimeout(120000);

  beforeAll(async () => {
    console.log('Starting PostgreSQL container...');

    try {
      // Създаване и стартиране на PostgreSQL контейнер с подобрени настройки
      container = await new GenericContainer('postgres:15')
        .withEnvironment({
          POSTGRES_DB: 'test_db',
          POSTGRES_USER: 'test_user',
          POSTGRES_PASSWORD: 'test_password',
        })
        .withExposedPorts(5432)
        .withWaitStrategy(
          Wait.forAll([
            Wait.forLogMessage(/database system is ready to accept connections/),
            Wait.forListeningPorts(), // Без аргументи в актуалната версия
          ]),
        )
        .withCommand([
          'postgres',
          '-c',
          'max_connections=100',
          '-c',
          'shared_buffers=256MB',
          '-c',
          'log_statement=all',
          '-c',
          'idle_in_transaction_session_timeout=5000', // Настройка за по-бързо затваряне на неактивни транзакции
        ])
        .withStartupTimeout(60000) // 60 секунди таймаут
        .start();

      // Показване на информация за контейнера за диагностика
      console.log(`Container started: ${container.getId()}`);
      console.log(`Host: ${container.getHost()}, Port: ${container.getMappedPort(5432)}`);

      // Изчакване допълнително, за да сме сигурни, че PostgreSQL е готов
      console.log('Waiting additional time for PostgreSQL to be fully ready...');
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Конфигурация за TypeORM DataSource с подобрени настройки за връзка
      console.log('Connecting to test database...');
      dataSource = new DataSource({
        type: 'postgres',
        host: container.getHost(),
        port: container.getMappedPort(5432),
        username: 'test_user',
        password: 'test_password',
        database: 'test_db',
        synchronize: false,
        logging: true,
        connectTimeoutMS: 60000, // Добавяме таймаут за връзка
        extra: {
          connectionTimeoutMillis: 60000, // Таймаут на pg клиента
          max: 5, // Ограничаваме броя на връзките
          application_name: 'migration-test', // За по-добро проследяване
          idle_in_transaction_session_timeout: 5000, // таймаут за неактивни транзакции
          statement_timeout: 10000, // таймаут за заявки
          pool: {
            idleTimeoutMillis: 1000, // по-бързо затваряне на неизползвани връзки
            max: 5,
            allowExitOnIdle: true, // разрешаване на програмата да приключи дори при наличие на idle връзки
          },
        },
        entities: [],
        migrations: [CreateInitialSchema1683456789000, AddAdditionalIndices1683456789001],
        migrationsTableName: 'migrations_history_test',
      });

      // Инициализираме връзката с базата
      await dataSource.initialize();
      console.log('Connection to the test database was successful!');
    } catch (error) {
      console.error('Error during setup:', error);

      // Ако контейнерът е стартиран, показваме логовете
      if (container) {
        try {
          const logs = await container.logs();
          console.log('Container logs:', logs);
        } catch (logError) {
          console.error('Failed to fetch container logs:', logError);
        }
      }

      throw error;
    }
  });

  // Подобрено почистване след всички тестове
  afterAll(async () => {
    // Първо затваряме връзката с базата данни
    if (dataSource?.isInitialized) {
      console.log('Closing database connection...');
      try {
        await dataSource.destroy();
        console.log('Database connection closed successfully');
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    }

    // Изчакваме малко, за да може да се затворят всички висящи връзки
    console.log('Waiting for connections to close completely...');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Спираме контейнера
    if (container) {
      console.log('Stopping container...');
      try {
        await container.stop();
        console.log('Container stopped successfully!');
      } catch (error) {
        console.error('Error stopping container:', error);
      }
    }

    // За по-сигурно затваряме и pg pool връзките глобално
    try {
      // @ts-ignore - достъпваме вътрешен обект
      const pgPool = require('pg/lib/native/index').Pool;
      const pools = pgPool?._pools || [];
      if (pools.length) {
        console.log(`Closing ${pools.length} postgres pools...`);

        // Дефинираме интерфейс за пула
        interface PgPool {
          end: () => void;
        }

        pools.forEach((p: PgPool) => p.end());
      }
    } catch (e) {
      console.log('No pg pools to clean');
    }
  });

  it('трябва да изпълни миграциите успешно', async () => {
    try {
      // Изпълняване на всички pending миграции
      console.log('Running migrations...');
      const migrations = await dataSource.runMigrations({ transaction: 'each' });
      console.log(`Applied ${migrations.length} migrations successfully`);

      // Проверка на приложените миграции
      const appliedMigrations = await dataSource.query(`SELECT * FROM migrations_history_test ORDER BY timestamp DESC`);
      console.log('Applied migrations:', appliedMigrations);

      expect(appliedMigrations.length).toBe(2);
      expect(appliedMigrations[0].name).toBe('AddAdditionalIndices1683456789001');
      expect(appliedMigrations[1].name).toBe('CreateInitialSchema1683456789000');
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  });

  it('трябва да revert-не миграциите успешно', async () => {
    try {
      // Revert на последната миграция
      console.log('Reverting last migration...');
      await dataSource.undoLastMigration({ transaction: 'each' });
      console.log('Last migration reverted successfully');

      // Проверка на останалите миграции
      const remainingMigrations = await dataSource.query(
        `SELECT * FROM migrations_history_test ORDER BY timestamp DESC`,
      );
      console.log('Remaining migrations after revert:', remainingMigrations);

      expect(remainingMigrations.length).toBe(1);
      expect(remainingMigrations[0].name).toBe('CreateInitialSchema1683456789000');
    } catch (error) {
      console.error('Error reverting migration:', error);
      throw error;
    }
  });
});
