import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import 'reflect-metadata'
import { AppConfigModule } from './config/config.module'

import { TestController } from './test/test.controller'

@Module({
  imports: [
    AppConfigModule,
    // Configure the global TypeORM connection. The configuration is loaded at runtime
    // via Nest's ConfigService, which itself is provided by AppConfigModule.
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // When running unit / integration tests we want to avoid depending on a real Postgres
        // instance. Instead we spin up an in-memory SQLite database that is fast and completely
        // isolated. This branch is triggered by setting NODE_ENV=test (see jest configuration).
        if (config.get<string>('NODE_ENV') === 'test') {
          return {
            type: 'sqlite',
            database: ':memory:',
            // Automatically drop the schema between test runs so we always start from a clean slate.
            dropSchema: true,
            entities: [__dirname + '/entities/**/*.entity.{ts,js}'],
            synchronize: true,
            logging: false,
          }
        }

        // Default – use the Postgres connection details supplied via environment variables.
        return {
          type: 'postgres',
          url: config.get<string>('DATABASE_URL'),
          entities: [__dirname + '/entities/**/*.entity.{ts,js}'],
          migrations: [__dirname + '/database/migrations/*.{ts,js}'],
          migrationsTableName: 'migrations',
          synchronize: false, // NEVER use synchronize in production
          logging: config.get<string>('NODE_ENV') === 'development',
          ssl:
            config.get<string>('NODE_ENV') === 'production'
              ? { rejectUnauthorized: false }
              : undefined,
        }
      },
    }),
  ],
  controllers: [TestController],
})
export class AppModule {}
