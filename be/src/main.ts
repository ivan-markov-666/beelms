import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

dotenv.config();

export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('HTTP');
  const defaultMediaRoot = path.join(process.cwd(), 'media');
  const mediaRootEnv = process.env.MEDIA_ROOT;
  const mediaRoot =
    mediaRootEnv && mediaRootEnv.trim().length > 0
      ? mediaRootEnv
      : defaultMediaRoot;

  app.setGlobalPrefix('api');

  app.useBodyParser('json', {
    limit: process.env.REQUEST_BODY_LIMIT ?? '1mb',
    verify: (
      req: Request & { rawBody?: Buffer },
      _res: Response,
      buf: Buffer,
    ) => {
      req.rawBody = buf;
    },
  });

  app.useBodyParser('urlencoded', {
    extended: false,
    limit: process.env.REQUEST_BODY_LIMIT ?? '1mb',
    verify: (
      req: Request & { rawBody?: Buffer },
      _res: Response,
      buf: Buffer,
    ) => {
      req.rawBody = buf;
    },
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'default-src': ["'self'"],
          'base-uri': ["'none'"],
          'frame-ancestors': ["'none'"],
          'object-src': ["'none'"],
          'img-src': ["'self'", 'data:'],
          'script-src': ["'self'"],
          'style-src': ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1_000_000;
      const statusCode = res.statusCode;
      const method = req.method;
      const url = req.originalUrl ?? req.url;

      const message = `${method} ${url} ${statusCode} ${durationMs.toFixed(1)}ms`;

      if (statusCode >= 500) {
        logger.error(message);
      } else if (statusCode >= 400) {
        logger.warn(message);
      } else {
        logger.log(message);
      }
    });

    next();
  });
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3001',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['X-Total-Count', 'Content-Disposition'],
  });
  app.useStaticAssets(path.join(mediaRoot, 'wiki'), {
    prefix: '/wiki/media',
  });
  app.useStaticAssets(path.join(mediaRoot, 'branding'), {
    prefix: '/branding/media',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  return app;
}

export async function bootstrap(): Promise<void> {
  const app = await createApp();
  await app.listen(process.env.PORT ?? 3000);
}

if (require.main === module) {
  void bootstrap();
}
