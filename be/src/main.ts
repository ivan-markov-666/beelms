import 'reflect-metadata';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const defaultMediaRoot = path.join(process.cwd(), 'media');
  const mediaRootEnv = process.env.MEDIA_ROOT;
  const mediaRoot =
    mediaRootEnv && mediaRootEnv.trim().length > 0
      ? mediaRootEnv
      : defaultMediaRoot;

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });
  app.useStaticAssets(path.join(mediaRoot, 'wiki'), {
    prefix: '/wiki/media',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
