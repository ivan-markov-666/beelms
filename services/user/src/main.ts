import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IpBlockGuard } from './common/guards/ip-block.guard';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Register global IP blocking guard
  const ipBlockGuard = app.get(IpBlockGuard);
  app.useGlobalGuards(ipBlockGuard);

  // Enable CORS
  app.enableCors();

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('API documentation for the User microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port, '127.0.0.1');
  console.log(`User microservice running on http://127.0.0.1:${port}`);
  console.log(
    `Swagger documentation available at: http://127.0.0.1:${port}/api`,
  );
}

void bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
});
