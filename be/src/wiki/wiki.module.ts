import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WikiArticle } from './wiki-article.entity';
import { WikiArticleVersion } from './wiki-article-version.entity';
import { WikiArticleFeedback } from './wiki-article-feedback.entity';
import { WikiArticleView } from './wiki-article-view.entity';
import { WikiArticleIpViewDaily } from './wiki-article-ip-view-daily.entity';
import { WikiService } from './wiki.service';
import { WikiController } from './wiki.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminWikiController } from './admin-wiki.controller';
import { User } from '../auth/user.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WikiArticle,
      WikiArticleVersion,
      WikiArticleFeedback,
      WikiArticleView,
      WikiArticleIpViewDaily,
      User,
    ]),
    AuthModule,
    SettingsModule,
  ],
  providers: [WikiService],
  controllers: [WikiController, AdminWikiController],
  exports: [WikiService],
})
export class WikiModule {}
