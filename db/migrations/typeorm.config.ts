import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { CreateInitialSchema1683456789000 } from './migrations/1683456789000-CreateInitialSchema';
import { AddAdditionalIndices1683456789001 } from './migrations/1683456789001-AddAdditionalIndices';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'learning_platform',
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  entities: [],
  migrations: [CreateInitialSchema1683456789000, AddAdditionalIndices1683456789001],
  migrationsTableName: 'migrations_history',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
