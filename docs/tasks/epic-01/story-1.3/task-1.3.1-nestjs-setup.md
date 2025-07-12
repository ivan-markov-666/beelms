# Task 1.3.1: NestJS Application Setup

## 🎯 Цел

Настройка на основната структура на NestJS приложението и конфигуриране на основните му компоненти.

## 🛠️ Действия

1. Инициализиране на NestJS приложение
2. Конфигуриране на основните модули
3. Настройка на базата данни с TypeORM
4. Добавяне на Swagger документация
5. Конфигуриране на валидация

## 📋 Код

### Инициализиране на приложението

```bash
# Създаване на ново NestJS приложение в директорията на API сървиса
cd apps/api
npx @nestjs/cli new . --package-manager=pnpm --skip-git --skip-install

# Инсталиране на основните зависимости
pnpm add @nestjs/typeorm typeorm pg @nestjs/config @nestjs/swagger class-validator class-transformer
pnpm add -D @types/node @types/express @types/bcrypt
```

### Основна конфигурация

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Глобална валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Swagger документация
  const config = new DocumentBuilder()
    .setTitle('QA Platform API')
    .setDescription('API документация за QA платформата')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API documentation available at: http://localhost:${port}/api/docs`);
}

bootstrap();
```

### Конфигурационен модул

```typescript
// apps/api/src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'qa_platform',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secretKey',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
});
```

### Основен модул

```typescript
// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## 📦 Deliverables

- [x] Инициализирано NestJS приложение
- [x] Конфигурирана връзка с базата данни
- [x] Добавена Swagger документация
- [x] Настройки за CORS
- [x] Глобална валидация с class-validator
- [ ] Тестове за основните функционалности

## 🧪 Тестване

```bash
# Стартиране на приложението в development режим
pnpm start:dev

# Стартиране с дебъг режим
pnpm start:debug

# Тестване на приложението
pnpm test

# Тестване с покритие на кода
pnpm test:cov
```

## 📝 Бележки

- Уверете се, че всички чувствителни данни са в `.env` файл
- Добавете подходящите скриптове в `package.json`
- Документирайте всички API ендпойнти с Swagger декоратори
