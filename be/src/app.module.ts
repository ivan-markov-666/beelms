import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WikiArticle } from './wiki/wiki-article.entity';
import { WikiArticleVersion } from './wiki/wiki-article-version.entity';
import { WikiModule } from './wiki/wiki.module';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { TrainingModule } from './training/training.module';
import { TasksModule } from './tasks/tasks.module';
import { RateLimitInterceptor } from './security/rate-limit/rate-limit.interceptor';
import { InMemoryRateLimitStore } from './security/rate-limit/rate-limit.store';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'qa4free',
      password: process.env.DB_PASSWORD ?? 'qa4free',
      database: process.env.DB_NAME ?? 'qa4free',
      entities: [WikiArticle, WikiArticleVersion, User],
      synchronize: false,
    }),
    WikiModule,
    AuthModule,
    TrainingModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    InMemoryRateLimitStore,
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
  ],
})
export class AppModule {}
