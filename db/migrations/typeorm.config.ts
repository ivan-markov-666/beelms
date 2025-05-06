import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'learning_platform',
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  entities: ['../services/*/src/entities/**/*.entity{.ts,.js}'],
  migrations: ['./migrations/**/*{.ts,.js}'],
  migrationsTableName: 'migrations_history',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});