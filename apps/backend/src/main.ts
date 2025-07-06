import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger, ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  // Global ValidationPipe – enforces DTO validation across the entire application
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false },
    }),
  )

  // CORS configuration – allowed origins are controlled via env var `CORS_ORIGIN`
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  })
  const port = process.env.PORT || 3000
  await app.listen(port)
  Logger.log(`Backend started on http://localhost:${port}`)
}

void bootstrap()
