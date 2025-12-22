import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { WikiService } from './wiki.service';
import { WikiListItemDto } from './dto/wiki-list-item.dto';
import { WikiArticleDetailDto } from './dto/wiki-article-detail.dto';
import { CreateWikiArticleFeedbackDto } from './dto/create-wiki-article-feedback.dto';
import { WikiRelatedArticleDto } from './dto/wiki-related-article.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

@Controller('wiki')
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Get('articles')
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('q') q?: string,
    @Query('lang') lang?: string,
  ): Promise<WikiListItemDto[]> {
    const pageNum = page ? Number(page) : undefined;
    const pageSizeNum = pageSize ? Number(pageSize) : undefined;
    return this.wikiService.getActiveArticlesList(
      pageNum,
      pageSizeNum,
      q,
      lang,
    );
  }

  @Get('articles/:slug')
  async findOne(
    @Param('slug') slug: string,
    @Query('lang') lang?: string,
  ): Promise<WikiArticleDetailDto> {
    return this.wikiService.getArticleBySlug(slug, lang);
  }

  @Get('articles/:slug/related')
  async getRelatedArticles(
    @Param('slug') slug: string,
    @Query('lang') lang?: string,
    @Query('limit') limit?: string,
  ): Promise<WikiRelatedArticleDto[]> {
    const limitNum = limit ? Number(limit) : undefined;
    return this.wikiService.getRelatedArticlesBySlug(slug, lang, limitNum);
  }

  @Get('articles/:slug/feedback/summary')
  getArticleFeedbackSummary(
    @Param('slug') slug: string,
  ): Promise<{ helpfulYes: number; helpfulNo: number; total: number }> {
    return this.wikiService.getArticleFeedbackSummary(slug);
  }

  @Post('articles/:slug/feedback')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(204)
  async submitArticleFeedback(
    @Param('slug') slug: string,
    @Body() dto: CreateWikiArticleFeedbackDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const userId = req.user?.userId ?? null;
    await this.wikiService.submitArticleFeedback(slug, userId, dto);
  }
}
