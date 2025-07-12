import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import * as path from 'path';
import * as entities from './entities';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    // Изрично изброяваме ентити класовете, вместо да се опитваме да ги филтрираме динамично
    const entitiesArray = [
      entities.User,
      entities.Category,
      entities.Topic,
      entities.TopicContent,
      entities.Test,
      entities.Question,
      entities.Answer,
      entities.UserProgress,
      entities.TestAttempt,
    ];

    // Път към миграционните файлове
    const migrationsPath = path.join(__dirname, '../../../database/migrations/*.{js,ts}');

    const isProduction = this.configService.get('NODE_ENV') === 'production';

    // База за PostgreSQL (production) или SQLite (development/testing)
    if (isProduction) {
      return {
        type: 'postgres',
        host: this.configService.get('DB_HOST', 'localhost'),
        port: this.configService.get<number>('DB_PORT', 5432),
        username: this.configService.get('DB_USERNAME', 'postgres'),
        password: this.configService.get('DB_PASSWORD', ''),
        database: this.configService.get('DB_DATABASE', 'qa_platform'),
        entities: entitiesArray,
        migrations: [migrationsPath],
        migrationsRun: this.configService.get('DB_MIGRATIONS_RUN', true),
        migrationsTableName: 'typeorm_migrations',
        synchronize: false, // В production винаги false, използваме миграции
        ssl: this.configService.get('DB_SSL', false) ? { rejectUnauthorized: false } : false,
        logging: this.configService.get('DB_LOGGING', false),
      };
    } else {
      // SQLite за development/testing
      return {
        type: 'sqlite',
        database: this.configService.get('DB_SQLITE_DATABASE', path.resolve(process.cwd(), 'qa_platform.sqlite')),
        entities: entitiesArray,
        migrations: [migrationsPath],
        migrationsRun: this.configService.get('DB_MIGRATIONS_RUN', false),
        migrationsTableName: 'typeorm_migrations',
        synchronize: this.configService.get('DB_SYNCHRONIZE', true), // За development можем да разрешим synchronize
        logging: this.configService.get('DB_LOGGING', true),
      };
    }
  }
}
