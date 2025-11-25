import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { WikiArticle } from './src/wiki/wiki-article.entity';
import { WikiArticleVersion } from './src/wiki/wiki-article-version.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'qa4free',
  password: process.env.DB_PASSWORD ?? 'qa4free',
  database: process.env.DB_NAME ?? 'qa4free',
  entities: [WikiArticle, WikiArticleVersion],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
