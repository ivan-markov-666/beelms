import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WikiArticle } from './wiki-article.entity';
import { WikiArticleVersion } from './wiki-article-version.entity';
import { WikiArticleFeedback } from './wiki-article-feedback.entity';
import { WikiService } from './wiki.service';
import { WikiController } from './wiki.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminWikiController } from './admin-wiki.controller';
import { User } from '../auth/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WikiArticle,
      WikiArticleVersion,
      WikiArticleFeedback,
      User,
    ]),
    AuthModule,
  ],
  providers: [WikiService],
  controllers: [WikiController, AdminWikiController],
  exports: [WikiService],
})
export class WikiModule {}
