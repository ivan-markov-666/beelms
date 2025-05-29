// services/auth/test/app.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { PasswordReset } from '../src/auth/entities/password-reset.entity';
import { Session } from '../src/auth/entities/session.entity';
import appConfig from '../src/config/app.config';
import { User } from '../src/users/entities/user.entity';
import { AppController } from './../src/app.controller';
import { AppService } from './../src/app.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  // Увеличаваме таймаута до 30 секунди
  jest.setTimeout(30000);

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        // Настройка на ConfigModule
        ConfigModule.forRoot({
          isGlobal: true,
          load: [appConfig],
        }),
        // Директна TypeORM конфигурация за тестовата база данни
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5433, // Порт, мапиран в docker-compose.test.yml
          username: 'test_user', // Потребител от docker-compose.test.yml
          password: 'test_password', // Парола от docker-compose.test.yml
          database: 'test_db', // База данни от docker-compose.test.yml
          entities: [User, PasswordReset, Session],
          synchronize: true, // Разрешаваме синхронизация за тестовете
          logging: false, // Изключваме logging за по-чисти тестови резултати
        }),
        // Импортираме AuthModule за достъп до всички необходими услуги
        AuthModule,
      ],
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  // Почистване след всички тестове
  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // Базов тест за проверка на работоспособност
  it('/ (GET)', () => {
    return request(app.getHttpServer() as Server)
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
