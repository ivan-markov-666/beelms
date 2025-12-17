import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { WikiArticle } from './src/wiki/wiki-article.entity';
import { WikiArticleVersion } from './src/wiki/wiki-article-version.entity';
import { User } from './src/auth/user.entity';
import { Course } from './src/courses/course.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'beelms',
  password: process.env.DB_PASSWORD ?? 'beelms',
  database: process.env.DB_NAME ?? 'beelms',
  entities: [WikiArticle, WikiArticleVersion, User, Course],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
