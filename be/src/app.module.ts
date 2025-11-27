import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WikiArticle } from './wiki/wiki-article.entity';
import { WikiArticleVersion } from './wiki/wiki-article-version.entity';
import { WikiModule } from './wiki/wiki.module';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
