import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { getConnection } from 'typeorm';
import { AppModule } from '../src/app.module';
import { Advertisement } from '../src/ads/entities/advertisement.entity';
import { UserAdView } from '../src/ads/entities/user-ad-view.entity';
import * as request from 'supertest';

const TEST_DB_CONFIG: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'test_user',
  password: 'test_password',
  database: 'test_db_ads',
  entities: [Advertisement, UserAdView],
  synchronize: true,
  dropSchema: true, // Clear database between test runs
};

export const createTestApp = async (): Promise<INestApplication> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
      }),
      TypeOrmModule.forRoot(TEST_DB_CONFIG),
      AppModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();
  return app;
};

export const closeTestApp = async (app: INestApplication): Promise<void> => {
  const connection = getConnection();
  if (connection.isConnected) {
    await connection.close();
  }
  await app.close();
};

export const getTestServer = (app: INestApplication): request.SuperTest<request.Test> => {
  return request(app.getHttpServer());
};

export const clearDatabase = async (): Promise<void> => {
  const connection = getConnection();
  if (connection.isConnected) {
    await connection.synchronize(true);
  }
};
