import 'reflect-metadata'
import { DataSource, DataSourceOptions } from 'typeorm'
import { config as loadEnv } from 'dotenv'

// Load environment variables from a local .env file when present. In production
// environments (e.g. CI, Docker, VPS) the variables are expected to be supplied
// by the runtime environment.
loadEnv()

/*
 * Centralised TypeORM DataSource configuration used by the CLI. Keeping this
 * file small and dependency-free ensures the CLI starts quickly and works both
 * locally and in CI.
 */
const isPostgres = Boolean(process.env.DATABASE_URL)

export const AppDataSource = new DataSource({
  type: isPostgres ? 'postgres' : 'sqlite',
  ...(isPostgres
    ? {
        url: process.env.DATABASE_URL,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      }
    : {
        database: process.env.SQLITE_PATH || 'tmp/migrations.sqlite',
      }),
  // Never auto-sync in production; use migrations instead.
  synchronize: false,
  logging: false, // Use path patterns so that newly added entities/migrations are picked up
  // automatically without touching this file.
  entities: ['src/entities/**/*.entity.{ts,js}'],
  migrations: ['src/database/migrations/*.{ts,js}'],
  migrationsTableName: 'migrations',
} as DataSourceOptions)

// NOTE: The DataSource is **NOT** initialised here. The CLI will handle that
// depending on the command that is executed (e.g. `migration:run`,
// `migration:generate`). This avoids unnecessary DB connections when the file
// is merely imported for its configuration.
