import dotenv from 'dotenv';
import { DatabaseSeeder, SeederOptions } from '../seeders/database.seeder';
import { DatabaseProvider, DatabaseConfig } from '../providers/database.provider';

export class SeederFactory {
  private databaseProvider: DatabaseProvider;

  constructor() {
    this.databaseProvider = new DatabaseProvider();
  }

  /**
   * Create a seeder instance with database connection
   */
  async createSeeder(databaseConfig: DatabaseConfig, seederOptions: SeederOptions = {}): Promise<DatabaseSeeder> {
    // Initialize database connection
    const dataSource = await this.databaseProvider.initialize(databaseConfig);

    // Auto-detect database type if not specified
    const options: SeederOptions = {
      databaseType: this.databaseProvider.getDatabaseType(),
      ...seederOptions,
    };

    return new DatabaseSeeder(dataSource, options);
  }

  /**
   * Create seeder for development environment
   */
  async createDevSeeder(options: Partial<SeederOptions> = {}): Promise<DatabaseSeeder> {
    // Load environment variables
    dotenv.config({ path: '.env.dev' });

    // Използваме in-memory SQLite за development за да избегнем Windows проблеми
    const config: DatabaseConfig = {
      type: 'sqlite',
      database: ':memory:', // Винаги in-memory за dev
      synchronize: true,
      logging: process.env.NODE_ENV !== 'production',
    };

    return this.createSeeder(config, {
      environment: 'dev',
      destructive: true,
      ...options,
    });
  }

  /**
   * Create seeder for test environment
   */
  async createTestSeeder(options: Partial<SeederOptions> = {}): Promise<DatabaseSeeder> {
    const config: DatabaseConfig = {
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      logging: false,
    };

    return this.createSeeder(config, {
      environment: 'test',
      destructive: true,
      ...options,
    });
  }

  /**
   * Create seeder for production environment
   */
  async createProdSeeder(options: Partial<SeederOptions> = {}): Promise<DatabaseSeeder> {
    const config: DatabaseConfig = {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'lms_prod',
      synchronize: false,
      logging: false,
    };

    return this.createSeeder(config, {
      environment: 'prod',
      destructive: false,
      ...options,
    });
  }

  /**
   * Create seeder for PostgreSQL database
   */
  async createPostgreSQLSeeder(
    databaseConfig: Partial<DatabaseConfig> = {},
    options: Partial<SeederOptions> = {}
  ): Promise<DatabaseSeeder> {
    const config: DatabaseConfig = {
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'lms_dev',
      synchronize: false,
      logging: false,
      ...databaseConfig,
    };

    return this.createSeeder(config, {
      environment: 'dev',
      destructive: false,
      ...options,
    });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.databaseProvider.close();
  }

  /**
   * Get database provider instance
   */
  getDatabaseProvider(): DatabaseProvider {
    return this.databaseProvider;
  }
}
