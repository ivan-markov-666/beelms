import { DataSource, DataSourceOptions } from 'typeorm';
import {
  User,
  Category,
  Topic,
  TopicContent,
  Test,
  Question,
  QuestionOption,
  UserProgress,
  TestAttempt,
} from '@lms/shared-types';

export type DatabaseType = 'postgres' | 'sqlite';

export interface DatabaseConfig {
  type: DatabaseType;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  synchronize?: boolean;
  logging?: boolean;
}

export class DatabaseProvider {
  private dataSource: DataSource | null = null;

  /**
   * Create a DataSource configuration for the specified database type
   */
  static createDataSourceOptions(config: DatabaseConfig): DataSourceOptions {
    const entities = [User, Category, Topic, TopicContent, Test, Question, QuestionOption, UserProgress, TestAttempt];

    const baseOptions: Partial<DataSourceOptions> = {
      entities,
      synchronize: config.synchronize ?? false,
      logging: config.logging ?? false,
    };

    if (config.type === 'postgres') {
      return {
        ...baseOptions,
        type: 'postgres',
        host: config.host ?? 'localhost',
        port: config.port ?? 5432,
        username: config.username ?? 'postgres',
        password: config.password ?? 'password',
        database: config.database ?? 'lms_dev',
      } as DataSourceOptions;
    } else if (config.type === 'sqlite') {
      // Use sql.js for better monorepo compatibility
      return {
        ...baseOptions,
        type: 'sqljs',
        autoSave: false,
        location: config.database === ':memory:' ? undefined : config.database,
      } as DataSourceOptions;
    }

    throw new Error(`Unsupported database type: ${config.type}`);
  }

  /**
   * Initialize database connection
   */
  async initialize(config: DatabaseConfig): Promise<DataSource> {
    if (this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    const options = DatabaseProvider.createDataSourceOptions(config);
    this.dataSource = new DataSource(options);

    await this.dataSource.initialize();
    console.log(`✅ Database connection initialized (${config.type})`);

    return this.dataSource;
  }

  /**
   * Get the current DataSource instance
   */
  getDataSource(): DataSource {
    if (!this.dataSource?.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.dataSource;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
      console.log('✅ Database connection closed');
    }
  }

  /**
   * Check if database is SQLite
   */
  isSQLite(): boolean {
    return (
      this.dataSource?.options.type === 'sqlite' ||
      this.dataSource?.options.type === 'sqljs' ||
      this.dataSource?.options.type === 'better-sqlite3'
    );
  }

  /**
   * Check if database is PostgreSQL
   */
  isPostgreSQL(): boolean {
    return this.dataSource?.options.type === 'postgres';
  }

  /**
   * Get database type
   */
  getDatabaseType(): DatabaseType {
    if (this.isSQLite()) return 'sqlite';
    if (this.isPostgreSQL()) return 'postgres';
    throw new Error('Unknown database type');
  }

  /**
   * Run database migrations (if any)
   */
  async runMigrations(): Promise<void> {
    if (!this.dataSource?.isInitialized) {
      throw new Error('Database not initialized');
    }

    await this.dataSource.runMigrations();
    console.log('✅ Database migrations completed');
  }

  /**
   * Synchronize database schema (development only)
   */
  async synchronize(): Promise<void> {
    if (!this.dataSource?.isInitialized) {
      throw new Error('Database not initialized');
    }

    await this.dataSource.synchronize();
    console.log('✅ Database schema synchronized');
  }
}
