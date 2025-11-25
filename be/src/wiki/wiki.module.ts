import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WikiArticle } from './wiki-article.entity';
import { WikiArticleVersion } from './wiki-article-version.entity';
import { WikiService } from './wiki.service';
import { WikiController } from './wiki.controller';

@Module({
  imports: [TypeOrmModule.forFeature([WikiArticle, WikiArticleVersion])],
  providers: [WikiService],
  controllers: [WikiController],
  exports: [WikiService],
})
export class WikiModule {}
