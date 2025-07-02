import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`Backend started on http://localhost:${port}`);
}

void bootstrap();
