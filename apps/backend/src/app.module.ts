import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import 'reflect-metadata'
import { AppConfigModule } from './config/config.module'

@Module({
  imports: [
    AppConfigModule,
    // Configure the global TypeORM connection. The configuration is loaded at runtime
    // via Nest's ConfigService, which itself is provided by AppConfigModule.
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        // We rely on path patterns instead of explicit imports so that newly added entities
        // and migrations are picked up automatically without code changes.
        entities: [__dirname + '/entities/**/*.entity.{ts,js}'],
        migrations: [__dirname + '/database/migrations/*.{ts,js}'],
        migrationsTableName: 'migrations',
        synchronize: false, // NEVER use synchronize in production
        logging: config.get<string>('NODE_ENV') === 'development',
        ssl:
          config.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : undefined,
      }),
    }),
  ],
})
export class AppModule {}
